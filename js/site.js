/* js/site.js – fonctions communes à toutes les pages
   - choix du skin (Rétro pixel / Moderne), mémorisé
   - traduction FR / EN de toute la page, mémorisée
   - lecture fiable des vidéos de fond (Edge, Chrome, Brave, Firefox, mobile)
   - animations d'apparition et halo qui suit la souris (skin Moderne)
   Chargé dans le <head> sans defer : le skin et la langue sont appliqués avant l'affichage. */
(function () {
  "use strict";
  var KEY_SKIN = "pf_skin", KEY_LANG = "pf_lang";
  var root = document.documentElement;

  function load(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* navigation privée */ } }

  var skin = load(KEY_SKIN, "retro") === "modern" ? "modern" : "retro";
  var lang = load(KEY_LANG, "fr") === "en" ? "en" : "fr";
  root.setAttribute("data-skin", skin);
  root.setAttribute("data-lang", lang);
  // évite d'afficher le français une fraction de seconde avant la traduction
  if (lang === "en") root.classList.add("i18n-pending");

  /* ---------------- Traduction ---------------- */
  var BLOCK = {};
  ("address article aside blockquote body details dialog dd div dl dt fieldset figcaption figure footer form " +
   "h1 h2 h3 h4 h5 h6 header hr li main nav ol p section table thead tbody tfoot tr td th ul video audio select " +
   "option button summary label").split(" ").forEach(function (t) { BLOCK[t.toUpperCase()] = true; });
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, SVG: 1, VIDEO: 1, AUDIO: 1, IFRAME: 1, PRE: 1, TEMPLATE: 1 };
  var ATTRS = ["title", "alt", "placeholder", "aria-label"];
  var saved = [];          // [{node, html|text|attr}] pour revenir au français
  var decoder = document.createElement("div");
  var translated = false;

  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }
  function isContainer(el) {
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (BLOCK[c.tagName]) return true;
    return false;
  }
  function trAttrs(el, A) {
    ATTRS.forEach(function (a) {
      var v = el.getAttribute && el.getAttribute(a);
      if (v && A[norm(v)]) { saved.push({ node: el, attr: a, value: v }); el.setAttribute(a, A[norm(v)]); }
    });
  }
  function walk(el, D, A) {
    if (SKIP[el.tagName] || el.hasAttribute("data-no-i18n")) return;
    trAttrs(el, A);
    if (!isContainer(el)) {
      var key = norm(el.textContent);
      if (key && D[key] !== undefined) {
        saved.push({ node: el, html: el.innerHTML });
        el.innerHTML = D[key];
      }
      var all = el.querySelectorAll("*");
      for (var i = 0; i < all.length; i++) trAttrs(all[i], A);
      return;
    }
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) {
        var k = norm(c.nodeValue);
        if (k && D[k] !== undefined) {
          decoder.innerHTML = D[k];
          saved.push({ node: c, text: c.nodeValue });
          c.nodeValue = c.nodeValue.replace(k, decoder.textContent);
        }
      } else if (c.nodeType === 1) walk(c, D, A);
    }
  }
  function toEnglish(done) {
    if (translated) { if (done) done(); return; }
    function apply() {
      var data = window.PF_I18N_EN || { text: {}, attr: {} };
      walk(document.body, data.text, data.attr);
      var t = norm(document.title);
      if (data.attr[t]) { saved.push({ title: document.title }); document.title = data.attr[t]; }
      translated = true;
      root.setAttribute("lang", "en");
      root.classList.remove("i18n-pending");
      if (done) done();
    }
    if (window.PF_I18N_EN) return apply();
    var s = document.createElement("script");
    s.src = "js/i18n-en.js?v=2";  // changer le numéro à chaque mise à jour des traductions (cache navigateur)
    s.onload = apply;
    s.onerror = function () { root.classList.remove("i18n-pending"); };
    document.head.appendChild(s);
  }
  function toFrench() {
    for (var i = saved.length - 1; i >= 0; i--) {
      var e = saved[i];
      if (e.title !== undefined) document.title = e.title;
      else if (e.attr) e.node.setAttribute(e.attr, e.value);
      else if (e.text !== undefined) e.node.nodeValue = e.text;
      else e.node.innerHTML = e.html;
    }
    saved = []; translated = false;
    root.setAttribute("lang", "fr");
  }

  /* ---------------- Vidéos de fond ---------------- */
  function setupVideos() {
    var vids = document.querySelectorAll(".videoback video");
    Array.prototype.forEach.call(vids, function (v) {
      v.muted = true; v.defaultMuted = true; v.setAttribute("muted", "");
      v.playsInline = true; v.setAttribute("playsinline", ""); v.setAttribute("preload", "auto");
      var box = v.parentNode;
      function fail() { box.classList.add("video-failed"); }
      v.addEventListener("error", fail, true);
      var src = v.querySelector("source");
      if (src) src.addEventListener("error", fail);
      function tryPlay() {
        if (root.getAttribute("data-skin") === "modern") { v.pause(); return; }
        var p = v.play();
        if (p && p.catch) p.catch(function () {
          // lecture automatique bloquée : on relance à la première interaction
          var once = function () { v.play().catch(function () {}); document.removeEventListener("pointerdown", once); };
          document.addEventListener("pointerdown", once);
        });
      }
      if (v.readyState >= 2) tryPlay(); else v.addEventListener("canplay", tryPlay, { once: true });
      tryPlay();
    });
  }
  function refreshVideos() {
    var modern = root.getAttribute("data-skin") === "modern";
    Array.prototype.forEach.call(document.querySelectorAll(".videoback video"), function (v) {
      if (modern) v.pause(); else v.play().catch(function () {});
    });
  }

  /* ---------------- Skin moderne : décor + animations ---------------- */
  function addDecor() {
    if (document.querySelector(".aurora")) return;
    var a = document.createElement("div");
    a.className = "aurora"; a.setAttribute("aria-hidden", "true"); a.setAttribute("data-no-i18n", "");
    a.innerHTML = '<span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span><span class="grid"></span><span class="grain"></span>';
    document.body.insertBefore(a, document.body.firstChild);
    var spot = document.createElement("div");
    spot.className = "spotlight"; spot.setAttribute("aria-hidden", "true");
    document.body.appendChild(spot);
    window.addEventListener("pointermove", function (e) {
      root.style.setProperty("--mx", e.clientX + "px");
      root.style.setProperty("--my", e.clientY + "px");
    }, { passive: true });
  }
  var REVEAL = ".page-header, .tp-card, .glass-panel, .v-card, .veille-header, .conclusion-box, .journal-box, .j-item, " +
    ".lm-box, .lm-schema, .ls-block, .cv-box, .project-card, .competence-box, .partner-box, .mission-card, .grid-card, " +
    ".hero-section, .stack-section, .card, .badge, .download-wrap, .oral-memo, .meta-item, .confidential-notice";
  function setupReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll(REVEAL));
    function inView(e) { var r = e.getBoundingClientRect(); return r.top < window.innerHeight - 20 && r.bottom > 0; }
    function check() {
      els = els.filter(function (e) { if (inView(e)) { e.classList.add("in"); return false; } return true; });
      if (!els.length) window.removeEventListener("scroll", onScroll);
    }
    var ticking = false;
    function onScroll() { if (!ticking) { ticking = true; setTimeout(function () { ticking = false; check(); }, 80); } }
    els.forEach(function (e, i) {
      e.classList.add("rv");
      e.style.setProperty("--rv-delay", Math.min(i % 6, 5) * 70 + "ms");
    });
    // ce qui est déjà à l'écran apparaît tout de suite (animation d'entrée), le reste au défilement
    requestAnimationFrame(check);
    setTimeout(check, 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { threshold: 0.05 });
      els.forEach(function (e) { io.observe(e); });
    }
  }

  /* ---------------- Boutons Skin / Langue ---------------- */
  var LABELS = {
    fr: { skin: { retro: "Moderne", modern: "Rétro" }, skinTitle: "Changer de style (Rétro pixel / Moderne)", lang: "EN", langTitle: "Translate the page into English" },
    en: { skin: { retro: "Modern", modern: "Retro" }, skinTitle: "Switch style (Pixel retro / Modern)", lang: "FR", langTitle: "Traduire la page en français" }
  };
  function buildTools() {
    var box = document.createElement("div");
    box.className = "site-tools"; box.setAttribute("data-no-i18n", "");
    box.innerHTML =
      '<button type="button" class="tool-btn" id="skin-btn"><span class="tool-ico">🎨</span><span class="tool-txt"></span></button>' +
      '<button type="button" class="tool-btn" id="lang-btn"><span class="tool-ico">🌐</span><span class="tool-txt"></span></button>';
    var nav = document.querySelector(".topnav .nav");
    if (nav) nav.appendChild(box); else { box.classList.add("floating"); document.body.appendChild(box); }
    function refresh() {
      var L = LABELS[lang], s = root.getAttribute("data-skin");
      var sb = box.querySelector("#skin-btn"), lb = box.querySelector("#lang-btn");
      sb.querySelector(".tool-txt").textContent = L.skin[s]; sb.title = L.skinTitle; sb.setAttribute("aria-label", L.skinTitle);
      lb.querySelector(".tool-txt").textContent = L.lang; lb.title = L.langTitle; lb.setAttribute("aria-label", L.langTitle);
    }
    box.querySelector("#skin-btn").addEventListener("click", function () {
      skin = root.getAttribute("data-skin") === "modern" ? "retro" : "modern";
      root.classList.add("skin-switching");
      root.setAttribute("data-skin", skin); save(KEY_SKIN, skin);
      refreshVideos(); refresh();
      setTimeout(function () { root.classList.remove("skin-switching"); }, 700);
    });
    box.querySelector("#lang-btn").addEventListener("click", function () {
      if (lang === "fr") { lang = "en"; save(KEY_LANG, "en"); root.setAttribute("data-lang", "en"); toEnglish(refresh); }
      else { lang = "fr"; save(KEY_LANG, "fr"); root.setAttribute("data-lang", "fr"); toFrench(); refresh(); }
    });
    refresh();
  }

  /* ---------------- Menus déroulants au toucher (mobile) ---------------- */
  function setupDropdowns() {
    Array.prototype.forEach.call(document.querySelectorAll(".dd > .dd-toggle"), function (t) {
      t.addEventListener("click", function (e) {
        e.preventDefault();
        var dd = t.parentNode, open = dd.classList.contains("open");
        Array.prototype.forEach.call(document.querySelectorAll(".dd.open"), function (o) { o.classList.remove("open"); });
        if (!open) dd.classList.add("open");
      });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest || !e.target.closest(".dd"))
        Array.prototype.forEach.call(document.querySelectorAll(".dd.open"), function (o) { o.classList.remove("open"); });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    addDecor();
    setupVideos();
    setupDropdowns();
    setupReveal();
    buildTools();
    if (lang === "en") toEnglish(function () {
      var b = document.querySelector("#lang-btn .tool-txt"); if (b) b.textContent = "FR";
    });
    // sécurité : si la traduction ne charge pas, on n'empêche jamais l'affichage
    setTimeout(function () { root.classList.remove("i18n-pending"); }, 2500);
  });

  window.PF = { toEnglish: toEnglish, toFrench: toFrench };
})();
