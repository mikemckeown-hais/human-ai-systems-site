/* Rich output renderers for the website assistant (R1.9a). Lazy-loaded the first time Alan shows a visual.
   Specs arrive already validated by the Worker (src/visuals.js); this file checks the shape again and builds
   every element with DOM methods and textContent, never from HTML strings. */
var NS = "http://www.w3.org/2000/svg";
var cssDone = false;
function h(tag, attrs, kids) {
  var n = document.createElement(tag);
  for (var k in attrs || {}) { if (k === "text") n.textContent = attrs[k]; else if (k === "class") n.className = attrs[k]; else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]); else n.setAttribute(k, attrs[k]); }
  (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return n;
}
function s(tag, attrs, text) { var n = document.createElementNS(NS, tag); for (var k in attrs || {}) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; return n; }
function ensureCss(base) { if (cssDone) return; cssDone = true; document.head.appendChild(h("link", { rel: "stylesheet", href: base + "visuals/render.css" })); }
var isPath = function (p) { return typeof p === "string" && /^\/[A-Za-z0-9\-_/.]*$/.test(p) && p.indexOf("//") < 0; };

function figure(ev, kids) {
  var f = h("figure", { class: "hasv hasv-" + ev.type, "aria-label": ev.alt || "" }, kids);
  f.appendChild(h("figcaption", { class: "hasv-sr", text: ev.alt || "" }));
  return f;
}

// ---------- framework ----------
function framework(ev, ctx) {
  var sp = ev.spec || {};
  var box = h("div");
  var fig = figure(ev, [h("p", { class: "hasv-title", text: sp.title || "" }), box]);
  if (sp.caption) fig.insertBefore(h("p", { class: "hasv-cap", text: sp.caption }), fig.lastChild);
  if (!/^[a-z_]+$/.test(sp.framework || "")) return fig;
  fetch(ctx.base + "visuals/" + sp.framework + ".svg").then(function (r) { return r.ok ? r.text() : ""; }).then(function (txt) {
    var doc = new DOMParser().parseFromString(txt, "image/svg+xml");
    var svg = doc.documentElement;
    if (!svg || svg.nodeName !== "svg") return;
    svg = document.importNode(svg, true);
    svg.setAttribute("aria-hidden", "true");
    if (sp.highlight) {
      var g = svg.querySelector('[data-stage="' + sp.highlight.replace(/[^a-z_]/g, "") + '"]');
      if (g) {
        g.classList.add("on");
        var r = g.querySelector("rect");
        var y = Number(r.getAttribute("y")), w = Number(r.getAttribute("width")), x = Number(r.getAttribute("x"));
        g.appendChild(s("text", { class: "hasv-here", x: x + w - 12, y: y + 22, "text-anchor": "end" }, "YOU ARE HERE"));
      }
    }
    box.appendChild(svg);
  }).catch(function () {});
  return fig;
}

// ---------- flow: deterministic layered layout, top to bottom ----------
function wrap(label, maxChars) {
  var words = String(label).split(" "), lines = [""];
  words.forEach(function (w) { var cur = lines[lines.length - 1]; if ((cur + " " + w).trim().length > maxChars && cur) lines.push(w); else lines[lines.length - 1] = (cur + " " + w).trim(); });
  if (lines.length > 2) { lines = [lines[0], lines.slice(1).join(" ")]; if (lines[1].length > maxChars) lines[1] = lines[1].slice(0, maxChars - 1) + "…"; }
  return lines;
}
var flowId = 0;
function flow(ev) {
  var sp = ev.spec || {}, nodes = (sp.nodes || []).slice(0, 12), edges = (sp.edges || []).slice(0, 24);
  var byId = {}; nodes.forEach(function (n) { byId[n.id] = n; });
  edges = edges.filter(function (e) { return byId[e.from] && byId[e.to]; });
  // Layer = longest path from a source, ignoring edges that close a cycle (DFS order).
  var out = {}; nodes.forEach(function (n) { out[n.id] = []; });
  edges.forEach(function (e) { out[e.from].push(e.to); });
  var state = {}, order = [], back = {};
  function dfs(id) { state[id] = 1; out[id].forEach(function (t) { if (state[t] === 1) back[id + ">" + t] = true; else if (!state[t]) dfs(t); }); state[id] = 2; order.unshift(id); }
  nodes.forEach(function (n) { if (!state[n.id]) dfs(n.id); });
  var layer = {}; order.forEach(function (id) { layer[id] = layer[id] || 0; out[id].forEach(function (t) { if (!back[id + ">" + t]) layer[t] = Math.max(layer[t] || 0, layer[id] + 1); }); });
  var rows = [];
  nodes.forEach(function (n) { var l = layer[n.id] || 0; (rows[l] = rows[l] || []).push(n); });
  var packed = []; rows.forEach(function (r) { if (!r) return; for (var i = 0; i < r.length; i += 3) packed.push(r.slice(i, i + 3)); });
  var W = 360, NH = 46, VG = 34, TOP = 6, pos = {};
  packed.forEach(function (r, ri) {
    var nw = r.length === 1 ? 220 : r.length === 2 ? 158 : 106, gap = (W - r.length * nw) / (r.length + 1);
    r.forEach(function (n, i) { pos[n.id] = { x: gap + i * (nw + gap), y: TOP + ri * (NH + VG), w: nw, h: NH }; });
  });
  var H = TOP + packed.length * (NH + VG) - VG + 8;
  var mid = "hasvA" + (++flowId);
  var svg = s("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "hasv-flow", "aria-hidden": "true" });
  var defs = s("defs"), mk = s("marker", { id: mid, viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" });
  mk.appendChild(s("path", { d: "M0 0 L10 5 L0 10 z", fill: "#6B7C8F" })); defs.appendChild(mk); svg.appendChild(defs);
  edges.forEach(function (e) {
    var a = pos[e.from], b = pos[e.to], d, lx, ly;
    if (b.y > a.y) { var x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y; d = "M" + x1 + " " + y1 + " C" + x1 + " " + (y1 + 18) + " " + x2 + " " + (y2 - 18) + " " + x2 + " " + (y2 - 2); lx = (x1 + x2) / 2 + 4; ly = (y1 + y2) / 2 + 3; }
    else if (b.y === a.y) { var right = b.x > a.x; var sx = right ? a.x + a.w : a.x, tx = right ? b.x : b.x + b.w, yy = a.y + a.h / 2; d = "M" + sx + " " + yy + " L" + (tx + (right ? -2 : 2)) + " " + yy; lx = (sx + tx) / 2; ly = yy - 5; }
    else { var sx2 = a.x + a.w, ex = b.x + b.w, sy = a.y + a.h / 2, ey = b.y + b.h / 2, cx = Math.min(W - 3, Math.max(sx2, ex) + 22); d = "M" + sx2 + " " + sy + " C" + cx + " " + sy + " " + cx + " " + ey + " " + (ex + 2) + " " + ey; lx = cx - 2; ly = (sy + ey) / 2; }
    svg.appendChild(s("path", { d: d, class: "e", "marker-end": "url(#" + mid + ")" }));
    if (e.label) svg.appendChild(s("text", { x: lx, y: ly, class: "el", "text-anchor": "middle" }, e.label));
  });
  var kinds = {};
  nodes.forEach(function (n) {
    var p = pos[n.id], k = n.kind || "plain"; kinds[k] = true;
    var g = s("g", { class: "n " + k });
    g.appendChild(s("rect", { x: p.x, y: p.y, width: p.w, height: p.h, rx: 9 }));
    var lines = wrap(n.label, Math.floor(p.w / 7));
    lines.forEach(function (ln, i) { g.appendChild(s("text", { x: p.x + p.w / 2, y: p.y + p.h / 2 + 4.5 + (i - (lines.length - 1) / 2) * 15, "text-anchor": "middle" }, ln)); });
    svg.appendChild(g);
  });
  var kids = [sp.title ? h("p", { class: "hasv-title", text: sp.title }) : null, svg];
  var names = { person: "Person", ai: "AI", system: "System" }, key = h("div", { class: "hasv-key", "aria-hidden": "true" });
  ["person", "ai", "system"].forEach(function (k) { if (kinds[k]) key.appendChild(h("span", { class: k }, [h("i"), names[k]])); });
  if (key.childNodes.length) kids.push(key);
  return figure(ev, kids);
}

// ---------- comparison ----------
function comparison(ev) {
  var sp = ev.spec || {}, t = h("table");
  if (sp.title) t.appendChild(h("caption", { class: "hasv-sr", text: sp.title }));
  var tr = h("tr"); (sp.columns || []).forEach(function (c) { tr.appendChild(h("th", { scope: "col", text: c })); }); t.appendChild(h("thead", {}, [tr]));
  var tb = h("tbody"); (sp.rows || []).forEach(function (r) { var row = h("tr"); r.forEach(function (c, i) { row.appendChild(h(i === 0 ? "th" : "td", i === 0 ? { scope: "row", text: c, style: "background:#F3F5F7;color:#1F3A5F;white-space:normal" } : { text: c })); }); tb.appendChild(row); }); t.appendChild(tb);
  return figure(ev, [sp.title ? h("p", { class: "hasv-title", text: sp.title }) : null, h("div", { class: "hasv-tablewrap", tabindex: "0", role: "region", "aria-label": sp.title || "Comparison table" }, [t])]);
}

// ---------- page card ----------
function pageCard(ev) {
  var sp = ev.spec || {};
  if (!isPath(sp.path)) return null;
  var a = h("a", { class: "hasv-card", href: sp.path }, [
    sp.image && /^\/images\/[A-Za-z0-9._\/-]+$/.test(sp.image) ? h("img", { src: sp.image, alt: "", loading: "lazy", width: "96", height: "64" }) : null,
    h("div", {}, [h("b", { text: sp.title || sp.path }), sp.summary ? h("span", { text: sp.summary }) : null]),
  ]);
  return figure(ev, [a]);
}

// ---------- video: nothing loads from YouTube until the visitor presses play ----------
function video(ev) {
  var sp = ev.spec || {}, frame = h("div", { class: "hasv-video" });
  var label = "Play: " + (sp.title || "video");
  if (sp.kind === "file" && /^https:\/\/media\.human-ai-systems\.com\//.test(sp.src || "")) {
    if (sp.poster && /^https:\/\/media\.human-ai-systems\.com\//.test(sp.poster)) frame.appendChild(h("img", { src: sp.poster, alt: "", loading: "lazy" }));
    frame.appendChild(h("button", { type: "button", class: "hasv-play", "aria-label": label, text: "Play", onclick: function () {
      while (frame.firstChild) frame.removeChild(frame.firstChild);
      var v = h("video", { src: sp.src, controls: "", autoplay: "", playsinline: "", preload: "auto", title: sp.title || "" }); frame.appendChild(v); try { v.focus(); } catch (e) {}
    } }));
  } else if (sp.kind === "youtube" && /^[A-Za-z0-9_-]{11}$/.test(sp.id || "")) {
    frame.appendChild(h("button", { type: "button", class: "hasv-play", "aria-label": label, text: "Play video", onclick: function () {
      while (frame.firstChild) frame.removeChild(frame.firstChild);
      frame.appendChild(h("iframe", { src: "https://www.youtube-nocookie.com/embed/" + sp.id + "?autoplay=1&rel=0&playsinline=1&modestbranding=1", title: sp.title || "Video", allow: "autoplay; encrypted-media; picture-in-picture; fullscreen", allowfullscreen: "", loading: "lazy" }));
    } }));
  } else return null;
  return figure(ev, [h("p", { class: "hasv-title", text: sp.title || "" }), frame]);
}

// ---------- AIOS explorer: same-origin page in a large panel, full screen on mobile ----------
function explorer(ev) {
  var sp = ev.spec || {};
  if (!/^\/[a-z-]+\/explorer\/\?embed=1#(benefits|what|how)$/.test(sp.src || "")) return null;
  var names = { benefits: "what it does for you", what: "what it is", how: "how you get one" };
  var btn = h("button", { type: "button", class: "hasv-btn", text: "Open the explorer" });
  btn.addEventListener("click", function () {
    var close = h("button", { type: "button", text: "Close" });
    var ov = h("div", { class: "hasv-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Business AI Operating System explorer" }, [
      h("header", {}, [h("span", { text: "Business AI Operating System explorer" }), close]),
      h("iframe", { src: sp.src, title: "Interactive Business AI Operating System explorer", allow: "fullscreen" }),
    ]);
    function shut() { document.removeEventListener("keydown", onKey, true); ov.remove(); btn.focus(); }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); shut(); } }
    close.addEventListener("click", shut);
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(ov);
    close.focus();
  });
  return figure(ev, [h("p", { class: "hasv-title", text: "Business AI Operating System explorer" }), h("div", { class: "hasv-explore" }, [h("p", { text: "An interactive 3D model, opened at " + (names[sp.world] || names.benefits) + "." }), btn])]);
}

var R = { framework: framework, flow: flow, comparison: comparison, page_card: pageCard, video: video, aios_explorer: explorer };
export function render(ev, ctx) {
  ensureCss(ctx.base);
  var fn = R[ev && ev.type];
  var node = null;
  try { node = fn ? fn(ev, ctx) : null; } catch (e) { node = null; }
  // Anything that cannot be drawn falls back to its text description.
  return node || h("p", { class: "hasv-cap", text: ev && ev.alt ? ev.alt : "" });
}
