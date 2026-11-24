/* Human-AI Systems website assistant (Alan). Plan: 06 Marketing/Website/website-assistant/PLAN.md
   Loads async. Draws nothing unless the Worker's /v1/config says enabled (kill switch).
   Writes nothing to the device and loads no third-party script until the visitor opens the chat. */
(function () {
  "use strict";
  if (window.__hasAssistant) return;
  window.__hasAssistant = true;

  var host = location.hostname;
  var API = /(^|\.)human-ai-systems\.com$/.test(host) ? "https://assistant.human-ai-systems.com" : "https://assistant-dev.human-ai-systems.com";
  var KEY = "has-assistant";
  var TZ = (Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London");
  var BOOK = "https://calendar.app.google/1QegoWKcVe8CkKUs7?ctz=" + encodeURIComponent(TZ);
  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/[^/]*$/, "") : "/assets/assistant/";

  var cfg = null, state = null, ui = null, busy = false, inflight = null, navTimer = null, lastFocus = null;

  function readState() { try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function saveState() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: session lasts this page only */ } }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function api(path, opts) {
    opts = opts || {};
    var h = { "content-type": "application/json" };
    if (state && state.token) h.authorization = "Bearer " + state.token;
    return fetch(API + path, { method: opts.method || "GET", headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined, signal: opts.signal, credentials: "omit" });
  }

  // ---------- boot ----------
  // Cookieless page count for the site's own analytics: path, referring site, utm_source. Nothing stored on the device.
  var UTM = null, CAMPAIGN = null;
  try { var q = new URLSearchParams(location.search); UTM = q.get("utm_source"); CAMPAIGN = q.get("utm_campaign"); } catch (e) { UTM = null; }
  function countPage() {
    try {
      var body = JSON.stringify({ p: location.pathname, r: document.referrer || "", u: UTM, c: CAMPAIGN });
      if (navigator.sendBeacon) navigator.sendBeacon(API + "/v1/pv", new Blob([body], { type: "text/plain" }));
    } catch (e) { /* counting is best effort */ }
  }
  // "Ask Alan" blocks on pages stay hidden unless the assistant is switched on.
  function wireOpeners() {
    var shows = document.querySelectorAll("[data-hasa-show]");
    for (var i = 0; i < shows.length; i++) shows[i].hidden = false;
    var opens = document.querySelectorAll("[data-hasa-open]");
    for (var j = 0; j < opens.length; j++) opens[j].addEventListener("click", function (e) { e.preventDefault(); open(true); });
  }

  function boot() {
    countPage();
    fetch(API + "/v1/config", { credentials: "omit" }).then(function (r) { return r.json(); }).then(function (c) {
      if (!c || c.enabled !== true) return;
      cfg = c;
      var link = el("link", { rel: "stylesheet", href: base + "assistant.css" });
      link.onload = function () {
        drawButton();
        wireOpeners();
        state = readState();
        if (state && state.open) open(false);
      };
      document.head.appendChild(link);
    }).catch(function () { /* assistant unavailable: the site carries on */ });
  }

  function drawButton() {
    var b = el("button", { type: "button", class: "hasa-launch", "aria-label": "Chat with Alan, our AI assistant", "aria-expanded": "false", "aria-controls": "hasa-panel", onclick: function () { ui && !ui.panel.hidden ? close() : open(true); } });
    b.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 6.5a1.5 1.5 0 1 0 0 .01zm5 0a1.5 1.5 0 1 0 0 .01zm5 0a1.5 1.5 0 1 0 0 .01z"/></svg><span class="hasa-launch-label">Ask Alan</span>';
    document.body.appendChild(b);
    window.__hasaButton = b;
  }

  // ---------- panel ----------
  function buildPanel() {
    var autoNav = el("input", { type: "checkbox", id: "hasa-autonav", checked: "", onchange: function () { setAutoNav(this.checked); } });
    var panel = el("div", { id: "hasa-panel", class: "hasa-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "hasa-title", hidden: "" }, [
      el("div", { class: "hasa-head" }, [
        el("img", { class: "hasa-avatar", src: "/images/headshots/480/Alan.webp", alt: "", width: "40", height: "40", decoding: "async" }),
        el("div", { class: "hasa-titles" }, [
          el("h2", { id: "hasa-title", class: "hasa-title", text: "Alan" }),
          el("p", { class: "hasa-sub", text: "AI assistant, Human-AI Systems" }),
        ]),
        el("button", { type: "button", class: "hasa-close", "aria-label": "Close the chat", onclick: close, text: "×" }),
      ]),
      el("div", { class: "hasa-log", role: "log", "aria-live": "polite", "aria-relevant": "additions" }),
      el("div", { class: "hasa-ts", "aria-hidden": "true" }),
      el("form", { class: "hasa-form", onsubmit: function (e) { e.preventDefault(); submit(); } }, [
        el("label", { for: "hasa-input", class: "hasa-sr", text: "Your message to Alan" }),
        el("textarea", { id: "hasa-input", class: "hasa-input", rows: "2", maxlength: "2000", placeholder: "Ask Alan a question", onkeydown: function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } } }),
        el("button", { type: "submit", class: "hasa-send", text: "Send" }),
      ]),
      el("div", { class: "hasa-foot" }, [
        el("label", { class: "hasa-toggle" }, [autoNav, " Take me to pages automatically"]),
        el("p", { class: "hasa-note" }, ["Alan is an AI. Answers can be wrong and are general information, not advice. ", el("a", { href: "/privacy/" , text: "Privacy" })]),
      ]),
    ]);
    panel.addEventListener("keydown", trapFocus);
    document.body.appendChild(panel);
    ui = { panel: panel, log: panel.querySelector(".hasa-log"), input: panel.querySelector("textarea"), send: panel.querySelector(".hasa-send"), ts: panel.querySelector(".hasa-ts"), autoNav: autoNav };
  }

  function trapFocus(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    var f = ui.panel.querySelectorAll('button:not([disabled]), textarea, input, a[href], [tabindex]:not([tabindex="-1"])');
    var list = Array.prototype.filter.call(f, function (x) { return x.offsetParent !== null; });
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open(byUser) {
    if (!ui) buildPanel();
    lastFocus = document.activeElement;
    ui.panel.hidden = false;
    document.documentElement.classList.add("hasa-open");
    window.__hasaButton && window.__hasaButton.setAttribute("aria-expanded", "true");
    state = state || readState() || { v: 1, open: true };
    state.open = true;
    saveState();
    if (!ui.log.childNodes.length) {
      if (state.sid) restore(); else greet();
    }
    if (byUser) ui.input.focus();
  }

  function close() {
    if (!ui) return;
    ui.panel.hidden = true;
    document.documentElement.classList.remove("hasa-open");
    window.__hasaButton && window.__hasaButton.setAttribute("aria-expanded", "false");
    if (state) { state.open = false; saveState(); }
    var back = lastFocus && lastFocus !== document.body && document.contains(lastFocus) && !ui.panel.contains(lastFocus) ? lastFocus : window.__hasaButton;
    back && back.focus();
  }

  // ---------- conversation ----------
  var STARTERS_DEFAULT = ["What does Human-AI Systems do?", "Who is Mike McKeown?", "What is a Business AI Operating System?", "I'd like to talk to Mike"];
  var STARTERS_PAGE = {
    "/services/": ["Which service would suit us?", "How does an engagement start?"],
    "/business-aios/": ["How would an AI operating system work for us?", "How long does it take to build?"],
    "/about/": ["What did Mike do at Verimatrix?", "How does Mike approach AI governance?"],
    "/training/": ["Which workshop fits a team new to AI?"],
  };
  function greet() {
    addAssistant("Hello, I'm Alan, an AI member of Mike McKeown's team at Human-AI Systems. I can explain what we do, tell you about Mike, walk you through a Business AI Operating System, or help you get a call in the diary.\n\nMike reads these conversations to improve the service, so please don't share anything sensitive.");
    var s = (STARTERS_PAGE[location.pathname] || []).concat(STARTERS_DEFAULT).slice(0, 4);
    var box = el("div", { class: "hasa-starters" }, s.map(function (t) { return el("button", { type: "button", class: "hasa-chip", text: t, onclick: function () { box.remove(); send(t); } }); }));
    ui.log.appendChild(box);
  }

  function restore() {
    api("/v1/sessions/" + state.sid).then(function (r) {
      if (r.status === 401 || r.status === 404) { state = { v: 1, open: true }; saveState(); greet(); return null; }
      return r.json();
    }).then(function (h) {
      if (!h) return;
      ui.autoNav.checked = !!h.auto_nav;
      if (!h.messages.length) { greet(); return; }
      h.messages.forEach(function (m) {
        if (m.role === "visitor") addVisitor(m.text);
        else { addAssistant(m.text || ""); (m.tools || (m.tool ? [m.tool] : [])).forEach(restoreTool); }
      });
      scrollEnd();
    }).catch(function () { greet(); });
  }

  function submit() {
    var t = ui.input.value.trim();
    if (!t || busy) return;
    ui.input.value = "";
    var chips = ui.log.querySelector(".hasa-starters");
    chips && chips.remove();
    send(t);
  }

  function ensureSession() {
    if (state && state.sid && state.token) return Promise.resolve();
    return turnstileToken().then(function (tok) {
      return api("/v1/sessions", { method: "POST", body: { turnstile: tok, entry_path: location.pathname, auto_nav: ui.autoNav.checked !== false, referrer: document.referrer || "", utm: UTM, utm_campaign: CAMPAIGN } });
    }).then(function (r) {
      return r.json().then(function (b) { if (r.status !== 201) throw b.error || "session"; state.sid = b.sid; state.token = b.token; saveState(); });
    });
  }

  function turnstileToken() {
    return new Promise(function (resolve, reject) {
      function render() {
        try {
          window.turnstile.render(ui.ts, { sitekey: cfg.turnstile_site_key, appearance: "interaction-only", callback: resolve, "error-callback": function () { reject("turnstile"); } });
        } catch (e) { reject("turnstile"); }
      }
      if (window.turnstile) return render();
      ui.ts.removeAttribute("aria-hidden");
      var s = el("script", { src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit", async: "", defer: "" });
      s.onload = render;
      s.onerror = function () { reject("turnstile"); };
      document.head.appendChild(s);
    });
  }

  function send(text) {
    busy = true;
    ui.send.disabled = true;
    addVisitor(text);
    var bubble = addAssistant("");
    bubble.classList.add("hasa-typing");
    var acc = "", tools = [], slotsEv = null;
    ensureSession().then(function () {
      inflight = new AbortController();
      return api("/v1/sessions/" + state.sid + "/messages", { method: "POST", body: { message: text, page_path: location.pathname, page_title: document.title, tz: TZ }, signal: inflight.signal });
    }).then(function (r) {
      if (r.status !== 200) return r.json().then(function (b) { throw b.error || "error"; });
      var reader = r.body.getReader(), dec = new TextDecoder(), buf = "";
      function pump() {
        return reader.read().then(function (x) {
          if (x.done) return;
          buf += dec.decode(x.value, { stream: true });
          var i;
          while ((i = buf.indexOf("\n\n")) >= 0) {
            var raw = buf.slice(0, i); buf = buf.slice(i + 2);
            var tm = raw.match(/^event: (.*)$/m), dm = raw.match(/^data: (.*)$/m);
            if (!tm || !dm) continue;
            var d; try { d = JSON.parse(dm[1]); } catch (e) { continue; }
            if (tm[1] === "delta") { acc += d.text; renderText(bubble, acc); bubble.classList.remove("hasa-typing"); scrollEnd(); }
            else if (tm[1] === "tool") tools.push(d);
            else if (tm[1] === "slots") slotsEv = d;
          }
          return pump();
        });
      }
      return pump();
    }).then(function () {
      bubble.classList.remove("hasa-typing");
      if (!acc) renderText(bubble, "Sorry, I lost my thread there. Could you ask again?");
      if (slotsEv) showSlots(slotsEv.slots);
      tools.forEach(handleTool);
    }).catch(function (err) {
      bubble.classList.remove("hasa-typing");
      if (err && err.name === "AbortError") return;
      if (err === "session_closed" || err === "bad_token" || err === "unknown_session") { state.sid = state.token = null; saveState(); }
      renderError(bubble, err);
    }).then(function () {
      busy = false; ui.send.disabled = false; inflight = null;
      var ae = document.activeElement;
      if (!ui.panel.hidden && (!ae || ae === document.body || !ui.panel.contains(ae))) ui.input.focus();
    });
  }

  function renderError(bubble, code) {
    var msg = {
      budget: "I'm taking a break for now. You can book a call with Mike directly, or start from the Start page.",
      rate_limited: "That's a lot of questions in a short time. Give it a few minutes and try again, or book a call with Mike.",
      session_turn_limit: "We've reached the end of what I can do in one conversation. Mike would be glad to pick it up with you.",
      session_token_limit: "We've reached the end of what I can do in one conversation. Mike would be glad to pick it up with you.",
      disabled: "I'm not available at the moment. You can still book a call with Mike.",
      session_closed: "This conversation has ended. You can start a new one by reloading the page, or book a call with Mike.",
      turnstile: "I couldn't confirm the chat is coming from a browser. Refresh the page and try again.",
    }[code] || "Something went wrong on my side. Try again in a moment, or book a call with Mike.";
    renderText(bubble, msg);
    bubble.appendChild(el("p", {}, [el("a", { class: "hasa-linkbtn", href: BOOK, target: "_blank", rel: "noopener", text: "Book a call with Mike" }), " ", el("a", { class: "hasa-linkbtn", href: "/start/", text: "Start page" })]));
  }

  // Controls from earlier replies, redrawn after a page load. Forms are not redrawn; links and visuals are.
  function restoreTool(t) {
    if (!t) return;
    if ((t.name === "navigate" || t.name === "show_link") && t.path) return addLink(t.path, t.title);
    if (t.name === "show_booking_link") return addBookLink();
    if (t.name === "show_visual") return showVisual(t);
  }
  function addBookLink() { var p = el("p", { class: "hasa-links" }, [el("a", { class: "hasa-linkbtn", href: BOOK, target: "_blank", rel: "noopener", text: "See Mike's times and book" })]); ui.log.appendChild(p); scrollEnd(); }
  var visuals = null;
  function showVisual(t) {
    var holder = el("div", { class: "hasa-visual" });
    ui.log.appendChild(holder);
    (visuals || (visuals = import(base + "visuals/render.js"))).then(function (m) { holder.appendChild(m.render(t, { base: base })); scrollEnd(); })
      .catch(function () { visuals = null; holder.appendChild(el("p", { class: "hasa-small", text: t.alt || "" })); });
  }
  function ended() {
    var p = el("p", { class: "hasa-nav", role: "status" }, ["This conversation has ended. ", el("a", { class: "hasa-linkbtn", href: BOOK, target: "_blank", rel: "noopener", text: "Book a call with Mike" })]);
    ui.log.appendChild(p); scrollEnd();
    ui.input.disabled = true; ui.send.disabled = true; ui.input.placeholder = "This conversation has ended";
    state.sid = state.token = null; state.ended = true; saveState();
  }

  function handleTool(t) {
    if (t.name === "show_link") return addLink(t.path, t.label || t.title);
    if (t.name === "show_booking_link") return addBookLink();
    if (t.name === "show_visual") return showVisual(t);
    if (t.name === "end_conversation") return ended();
    if (t.name === "request_verification") return verifyForm(t.purpose, null);
    if (t.name === "request_contact") return contactForm(t.topic);
    if (t.name === "book_meeting") return chooseSlot({ start: t.start, label: fmt(t.start) });
    if (t.name === "navigate") {
      if (t.path === location.pathname) return;
      if (!ui.autoNav.checked) return addLink(t.path, t.title);
      var secs = 3;
      var note = el("p", { class: "hasa-nav", role: "status" });
      var cancel = el("button", { type: "button", class: "hasa-linkbtn", text: "Stay here", onclick: function () { clearInterval(navTimer); note.textContent = "Staying here. "; note.appendChild(linkEl(t.path, t.title)); } });
      var tick = function () { note.textContent = "Taking you to " + t.title + " in " + secs + "… "; note.appendChild(cancel); };
      tick();
      ui.log.appendChild(note);
      scrollEnd();
      cancel.focus();
      navTimer = setInterval(function () {
        secs -= 1;
        if (secs <= 0) { clearInterval(navTimer); state.open = true; saveState(); location.assign(t.path); }
        else tick();
      }, 1000);
    }
  }


  // ---------- booking (R1.7): a booking is made only by the visitor's confirm click ----------
  // Some browsers print "GMT+0" for UK winter time: show GMT, and BST in UK summer time.
  function tidyZone(x) { x = String(x).replace(/\b(GMT|UTC)[+-]0(:00)?\b/g, "GMT"); return TZ === "Europe/London" ? x.replace(/\bGMT\+1(:00)?\b/g, "BST") : x; }
  function fmt(ms) { try { return tidyZone(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(ms))); } catch (e) { return new Date(ms).toString(); } }
  function card(cls) { var c = el("div", { class: "hasa-card " + (cls || "") }); ui.log.appendChild(c); scrollEnd(); return c; }
  function showSlots(slots) {
    var c = card("hasa-slots");
    c.appendChild(el("p", { class: "hasa-card-title", text: "Times for a 30-minute call with Mike" }));
    slots.forEach(function (sl) { c.appendChild(el("button", { type: "button", class: "hasa-chip", text: sl.label, onclick: function () { chooseSlot(sl); } })); });
    c.appendChild(el("p", { class: "hasa-small" }, ["None of these? ", el("a", { href: BOOK, target: "_blank", rel: "noopener", text: "See all of Mike's times" })]));
  }
  function chooseSlot(sl) { if (state.verified) confirmCard(sl); else verifyForm("booking", sl); }
  function field(id, label, type, extra) {
    var wrap = el("div", { class: "hasa-field" });
    wrap.appendChild(el("label", { for: id, text: label }));
    var a = { id: id, type: type || "text" }; for (var k in (extra || {})) a[k] = extra[k];
    wrap.appendChild(el("input", a));
    return wrap;
  }
  function verifyForm(purpose, slot) {
    var n = Date.now();
    var c = card("hasa-verify");
    var msg = el("p", { class: "hasa-small", role: "status" });
    var f = el("form", { onsubmit: function (e) { e.preventDefault(); start(); } }, [
      el("p", { class: "hasa-card-title", text: slot ? "Book " + slot.label : "Confirm your email" }),
      field("hasa-n" + n, "Your name", "text", { autocomplete: "name", required: "", maxlength: "120" }),
      field("hasa-e" + n, "Work email", "email", { autocomplete: "email", required: "", maxlength: "254" }),
      field("hasa-o" + n, "Organisation (optional)", "text", { autocomplete: "organization", maxlength: "80" }),
      el("p", { class: "hasa-small" }, ["We'll email you a six-digit code. If you book, Mike gets your name, email and this conversation so he can prepare for the call. ", el("a", { href: "/privacy/", text: "Privacy" })]),
      el("button", { type: "submit", class: "hasa-send", text: "Send code" }),
      msg,
    ]);
    c.appendChild(f);
    f.querySelector("input").focus();
    var email, name, org;
    function start() {
      name = f.querySelector("#hasa-n" + n).value.trim(); email = f.querySelector("#hasa-e" + n).value.trim(); org = f.querySelector("#hasa-o" + n).value.trim();
      msg.textContent = "Sending…";
      api("/v1/verify/start", { method: "POST", body: { sid: state.sid, email: email, name: name, purpose: purpose } }).then(function (r) { return r.json().then(function (b) { return { s: r.status, b: b }; }); }).then(function (x) {
        if (x.s !== 200) { msg.textContent = verr(x.b.error); return; }
        f.remove();
        codeForm();
      }).catch(function () { msg.textContent = verr(); });
    }
    function codeForm() {
      var m2 = el("p", { class: "hasa-small", role: "status" });
      var g = el("form", { onsubmit: function (e) { e.preventDefault(); confirm(); } }, [
        el("p", { class: "hasa-card-title", text: "Check your email" }),
        field("hasa-c" + n, "Six-digit code sent to " + email, "text", { inputmode: "numeric", autocomplete: "one-time-code", maxlength: "6", pattern: "[0-9]{6}", required: "" }),
        el("button", { type: "submit", class: "hasa-send", text: "Confirm" }),
        m2,
      ]);
      c.appendChild(g);
      g.querySelector("input").focus();
      function confirm() {
        var code = g.querySelector("input").value.trim();
        api("/v1/verify/confirm", { method: "POST", body: { sid: state.sid, email: email, code: code, name: name } }).then(function (r) { return r.json().then(function (b) { return { s: r.status, b: b }; }); }).then(function (x) {
          if (x.s !== 200) { m2.textContent = verr(x.b.error, x.b.attempts_left); return; }
          state.verified = true; saveState();
          g.remove();
          c.appendChild(el("p", { class: "hasa-small", text: "Thanks, " + name + ". Your email is confirmed." }));
          if (slot) confirmCard(slot, org);
        }).catch(function () { m2.textContent = verr(); });
      }
    }
  }
  function verr(code, left) {
    return ({ bad_email: "That email address doesn't look right.", disposable_email: "Please use a work or personal address rather than a temporary one.", verify_address_limit: "That address has had three codes today. Try again tomorrow, or use the booking link.", verify_daily_limit: "I can't send more codes today. The booking link still works.", wrong_code: "That code doesn't match." + (left !== undefined ? " " + left + " tries left." : ""), code_expired: "That code has expired. Ask for a new one.", too_many_attempts: "Too many tries. Ask for a new code.", no_code: "Ask for a code first." })[code] || "Something went wrong. Try again, or use the booking link.";
  }
  function confirmCard(slot, org) {
    var c = card("hasa-confirm");
    var m = el("p", { class: "hasa-small", role: "status" });
    var btn = el("button", { type: "button", class: "hasa-send", text: "Confirm booking" });
    btn.addEventListener("click", function () {
      btn.disabled = true; m.textContent = "Booking…";
      api("/v1/bookings", { method: "POST", body: { sid: state.sid, start: slot.start, organisation: org || "", tz: TZ } }).then(function (r) { return r.json().then(function (b) { return { s: r.status, b: b }; }); }).then(function (x) {
        if (x.s !== 201) { btn.disabled = false; m.textContent = ({ slot_taken: "That time has just gone. Please pick another.", already_booked: "You already have a call booked with Mike.", daily_cap: "Mike's diary is full for bookings through me today.", not_verified: "Please confirm your email first.", outside_window: "That time can't be booked." })[x.b.error] || "I couldn't book that. The booking link still works."; if (x.b.error !== "slot_taken") m.appendChild(el("a", { class: "hasa-linkbtn", href: BOOK, target: "_blank", rel: "noopener", text: "Booking link" })); return; }
        c.textContent = "";
        c.appendChild(el("p", { class: "hasa-card-title", text: "Booked: " + x.b.label }));
        c.appendChild(el("p", { class: "hasa-small", text: "The calendar invitation with a video link is on its way to your inbox." }));
        btn.remove();
      }).catch(function () { btn.disabled = false; m.textContent = "I couldn't book that. The booking link still works."; });
    });
    c.appendChild(el("p", { class: "hasa-card-title", text: slot.label }));
    c.appendChild(el("p", { class: "hasa-small", text: "30 minutes with Mike McKeown, by video." }));
    c.appendChild(btn);
    c.appendChild(m);
    btn.focus();
  }


  // ---------- contact capture (R1.8): consent box unticked, submit only when ticked ----------
  function contactForm(topic) {
    var n = Date.now();
    var c = card("hasa-contact");
    var msg = el("p", { class: "hasa-small", role: "status" });
    var box = el("input", { type: "checkbox", id: "hasa-k" + n });
    var send = el("button", { type: "submit", class: "hasa-send", text: "Send to Mike", disabled: "" });
    box.addEventListener("change", function () { send.disabled = !box.checked; });
    var f = el("form", { onsubmit: function (e) { e.preventDefault(); submitContact(); } }, [
      el("p", { class: "hasa-card-title", text: "Ask Mike to get in touch" }),
      field("hasa-cn" + n, "Your name", "text", { autocomplete: "name", required: "", maxlength: "120" }),
      field("hasa-ce" + n, "Email", "email", { autocomplete: "email", required: "", maxlength: "254" }),
      field("hasa-co" + n, "Organisation (optional)", "text", { autocomplete: "organization", maxlength: "120" }),
      el("label", { class: "hasa-toggle", for: "hasa-k" + n }, [box, " I'd like Mike to get in touch with me about this."]),
      el("p", { class: "hasa-small" }, ["Mike will see this conversation. ", el("a", { href: "/privacy/", text: "Privacy" })]),
      send, msg,
    ]);
    c.appendChild(f);
    f.querySelector("input").focus();
    function submitContact() {
      if (!box.checked) return;
      send.disabled = true; msg.textContent = "Sending…";
      api("/v1/contacts", { method: "POST", body: { sid: state.sid, name: f.querySelector("#hasa-cn" + n).value, email: f.querySelector("#hasa-ce" + n).value, organisation: f.querySelector("#hasa-co" + n).value, topic: topic || "", contact_requested: true } })
        .then(function (r) { return r.json().then(function (b) { return { s: r.status, b: b }; }); }).then(function (x) {
          if (x.s !== 201) { send.disabled = false; msg.textContent = ({ bad_email: "That email address doesn't look right.", disposable_email: "Please use an address you check.", name_required: "Please add your name.", capture_limit: "I've passed this on already. Mike will be in touch." })[x.b.error] || "That didn't go through. You can also book a call directly."; return; }
          c.textContent = "";
          c.appendChild(el("p", { class: "hasa-card-title", text: "Thanks. I've passed this to Mike." }));
          c.appendChild(el("p", { class: "hasa-small", text: x.b.civic ? "Mike will reply to you personally." : "He'll be in touch, usually within a working day." }));
        }).catch(function () { send.disabled = false; msg.textContent = "That didn't go through. You can also book a call directly."; });
    }
  }

  function linkEl(path, label) { return el("a", { class: "hasa-linkbtn", href: path, text: label || path, onclick: function () { state.open = true; saveState(); } }); }
  function addLink(path, label) { var p = el("p", { class: "hasa-links" }, [linkEl(path, label)]); ui.log.appendChild(p); scrollEnd(); }

  function setAutoNav(on) { if (state && state.sid) api("/v1/sessions/" + state.sid + "/prefs", { method: "POST", body: { auto_nav: on } }).catch(function () {}); }

  function addVisitor(text) { var b = el("div", { class: "hasa-msg hasa-me" }); b.appendChild(el("p", { text: text })); ui.log.appendChild(b); scrollEnd(); return b; }
  function addAssistant(text) { var b = el("div", { class: "hasa-msg hasa-alan" }); renderText(b, text); ui.log.appendChild(b); scrollEnd(); return b; }
  function scrollEnd() { ui.log.scrollTop = ui.log.scrollHeight; }

  // Plain text with a safe subset of Markdown: paragraphs, **bold**, "- " lists. Never HTML, links or images from text.
  function renderText(node, text) {
    while (node.firstChild) node.removeChild(node.firstChild);
    var blocks = String(text).split(/\n{2,}/);
    blocks.forEach(function (blk) {
      var lines = blk.split("\n");
      if (lines.every(function (l) { return /^\s*[-*] /.test(l); })) {
        var ul = el("ul");
        lines.forEach(function (l) { var li = el("li"); inline(li, l.replace(/^\s*[-*] /, "")); ul.appendChild(li); });
        node.appendChild(ul);
      } else if (blk.trim()) {
        var p = el("p"); inline(p, lines.join(" ")); node.appendChild(p);
      }
    });
  }
  function inline(node, s) {
    s.split(/(\*\*[^*]+\*\*)/).forEach(function (part) {
      if (/^\*\*[^*]+\*\*$/.test(part)) node.appendChild(el("strong", { text: part.slice(2, -2) }));
      else if (part) node.appendChild(document.createTextNode(part));
    });
  }

  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ui && !ui.panel.hidden && !ui.panel.contains(e.target)) close(); });
  window.addEventListener("pagehide", function () { if (inflight) try { inflight.abort(); } catch (e) {} });
  if (document.readyState === "complete") setTimeout(boot, 0);
  else window.addEventListener("load", function () { setTimeout(boot, 0); });
})();
