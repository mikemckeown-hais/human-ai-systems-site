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
  var BOOK = "https://calendar.app.google/1QegoWKcVe8CkKUs7?ctz=" + encodeURIComponent((Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London"));
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
  function boot() {
    fetch(API + "/v1/config", { credentials: "omit" }).then(function (r) { return r.json(); }).then(function (c) {
      if (!c || c.enabled !== true) return;
      cfg = c;
      var link = el("link", { rel: "stylesheet", href: base + "assistant.css" });
      link.onload = function () {
        drawButton();
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
        else { addAssistant(m.text || ""); if (m.tool) addLink(m.tool.path, m.tool.title); }
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
      return api("/v1/sessions", { method: "POST", body: { turnstile: tok, entry_path: location.pathname, auto_nav: ui.autoNav.checked !== false } });
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
    var acc = "", tools = [];
    ensureSession().then(function () {
      inflight = new AbortController();
      return api("/v1/sessions/" + state.sid + "/messages", { method: "POST", body: { message: text, page_path: location.pathname, page_title: document.title }, signal: inflight.signal });
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
          }
          return pump();
        });
      }
      return pump();
    }).then(function () {
      bubble.classList.remove("hasa-typing");
      if (!acc) renderText(bubble, "Sorry, I lost my thread there. Could you ask again?");
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
      turnstile: "I couldn't confirm the chat is coming from a browser. Refresh the page and try again.",
    }[code] || "Something went wrong on my side. Try again in a moment, or book a call with Mike.";
    renderText(bubble, msg);
    bubble.appendChild(el("p", {}, [el("a", { class: "hasa-linkbtn", href: BOOK, target: "_blank", rel: "noopener", text: "Book a call with Mike" }), " ", el("a", { class: "hasa-linkbtn", href: "/start/", text: "Start page" })]));
  }

  function handleTool(t) {
    if (t.name === "show_link") return addLink(t.path, t.label || t.title);
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
