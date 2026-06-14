/* Abdulrahman S. Al-Batati — portfolio v3 (light, bilingual, multi-page).
   Router · scroll-scrub cinematic · publications DB · robotics stack ·
   media collections · sphere · galleries · i18n. */

import { PROFILE, STATS, PROJECTS, PAPERS, RESEARCH_NOTE, RESEARCH_NOTE_AR, ROBOTS, PRINTS,
         PATENTS, EXPERIENCE, EDUCATION, SKILLS, REPOS, PUBS, TAXONOMY, STACK, CALISTHENICS,
         I18N, IMG } from "./data.js";
import { initSphere, webglOK } from "./sphere.js";
import { initCinematic } from "./cinematic.js";

const gsap = window.gsap, ST = window.ScrollTrigger;
gsap.registerPlugin(ST);
gsap.defaults({ ease: "expo.out", duration: 1 });

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch = matchMedia("(pointer: coarse)").matches;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

let lang = "en";
const T = () => I18N[lang];
const pick = (o, k) => (lang === "ar" ? (o[k + "_ar"] ?? o[k]) : o[k]);
const txEn = id => (TAXONOMY.find(t => t.id === id) || {})[lang] || id;

/* ── Lenis ── */
let lenis = null;
if (!reduced) {
  lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
  window.__lenis = lenis;
  lenis.on("scroll", ST.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ── cursor + magnetic ── */
if (!touch && !reduced) {
  const dot = $("#cursorDot"), ring = $("#cursorRing");
  let rx = -100, ry = -100;
  addEventListener("pointermove", e => { gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1, overwrite: "auto" }); rx = e.clientX; ry = e.clientY; }, { passive: true });
  gsap.ticker.add(() => { const x = gsap.getProperty(ring, "x"), y = gsap.getProperty(ring, "y"); gsap.set(ring, { x: x + (rx - x) * 0.16, y: y + (ry - y) * 0.16 }); });
  document.body.classList.add("hasCursor");
  window.__cursorBind = () => $$("a, button, .magnetic, #sphereCanvas, .gItem, .media-card, .pub-row").forEach(e => {
    if (e.__cb) return; e.__cb = 1;
    e.addEventListener("pointerenter", () => ring.classList.add("on"));
    e.addEventListener("pointerleave", () => ring.classList.remove("on"));
  });
  addEventListener("load", () => setTimeout(() => $$(".magnetic").forEach(e => {
    e.addEventListener("pointermove", ev => { const r = e.getBoundingClientRect(); gsap.to(e, { x: (ev.clientX - r.left - r.width / 2) * 0.3, y: (ev.clientY - r.top - r.height / 2) * 0.3, duration: 0.4 }); });
    e.addEventListener("pointerleave", () => gsap.to(e, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.4)" }));
  }), 400));
}

/* ════════════ ROUTER ════════════ */
function showPage(name) {
  $$(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + name));
  $$("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === name));
  lenis?.scrollTo(0, { immediate: true }); scrollTo(0, 0);
  if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
  requestAnimationFrame(() => ST.refresh());
  if (name === "beyond") initMedia();
}
$$("[data-nav]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); showPage(a.dataset.nav); closeMenu(); }));
$$("[data-scroll]").forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  if (!$("#page-home").classList.contains("active")) { showPage("home"); requestAnimationFrame(() => go(a.dataset.scroll)); }
  else go(a.dataset.scroll);
  closeMenu();
  function go(sel) { const t = $(sel); if (t) lenis ? lenis.scrollTo(t, { offset: -60 }) : t.scrollIntoView(); }
}));

/* ════════════ RENDER (re-runnable) ════════════ */
function renderDynamic() {
  const statsW = $("#stats"); statsW.innerHTML = "";
  STATS.forEach(s => statsW.append(el("div", "stat", `<span class="stat-n">${s.n}</span><span class="stat-l">${pick(s, "label")}</span>`)));
  $("#langs").innerHTML = (lang === "ar" ? PROFILE.languages_ar : PROFILE.languages).map(l => `<span class="chip">${l}</span>`).join("");

  // timeline
  const tl = $("#timeline"); tl.innerHTML = "";
  PAPERS.forEach((p, i) => {
    const n = el("article", "tl-item" + (i % 2 ? " right" : ""));
    n.innerHTML = `<div class="tl-dot"></div><div class="tl-card card"><span class="tl-year">${p.year}</span><span class="tl-tag">${p.tag}</span><h3>${p.title}</h3><p class="tl-venue">${p.venue} · <em>${pick(p, "role")}</em></p><a class="tl-doi" href="${p.doi}" target="_blank" rel="noopener">DOI ↗</a></div>`;
    tl.append(n);
  });
  $("#researchNote").textContent = lang === "ar" ? RESEARCH_NOTE_AR : RESEARCH_NOTE;

  // galleries
  const fill = (sel, items) => { const g = $(sel); g.innerHTML = ""; items.forEach((it, idx) => { const cap = pick(it, "cap"); const f = el("figure", "gItem"); f.innerHTML = `<img src="${IMG(it.id, "w480")}" alt="${cap}" loading="lazy"><figcaption>${cap}</figcaption>`; f.addEventListener("click", () => openLightbox(items, idx)); g.append(f); }); };
  fill("#robotsGrid", ROBOTS); fill("#printsGrid", PRINTS);

  // patents
  const pat = $("#patents"); pat.innerHTML = "";
  PATENTS.forEach(p => pat.append(el("article", "card patent", `<img src="${IMG(p.id, "w480")}" alt="${pick(p, "title")}" loading="lazy"><div><span class="tl-year">${p.year}</span><h3>${pick(p, "title")}</h3><p>${pick(p, "body")}</p></div>`)));

  // exp / edu
  const exp = $("#experience"); exp.innerHTML = "";
  EXPERIENCE.forEach(e => exp.append(el("div", "row", `<span class="row-when">${pick(e, "when")}</span><div class="row-body"><h4>${pick(e, "role")}</h4><p class="row-org">${pick(e, "org")}</p><p class="row-note">${pick(e, "note")}</p></div>`)));
  const edu = $("#education"); edu.innerHTML = "";
  EDUCATION.forEach(e => edu.append(el("div", "row", `<span class="row-when">${pick(e, "when")}</span><div class="row-body"><h4>${pick(e, "deg")}</h4><p class="row-org">${pick(e, "org")}</p>${pick(e, "extra") ? `<p class="row-note">${pick(e, "extra")}</p>` : ""}</div>`)));

  // skills
  const sk = $("#skills"); sk.innerHTML = "";
  SKILLS.forEach(g => sk.append(el("div", "skill-group card", `<h4>${pick(g, "group")}</h4>` + (lang === "ar" ? g.items_ar : g.items).map(i => `<span class="chip">${i}</span>`).join(""))));

  // repos
  const rp = $("#repos"); rp.innerHTML = "";
  REPOS.forEach(r => { const a = el("a", "card repo"); a.href = r.url; a.target = "_blank"; a.rel = "noopener"; a.innerHTML = `<div class="repo-top"><span class="repo-name">${r.name}</span><span class="repo-star">★ ${r.stars}</span></div><p>${pick(r, "desc")}</p><span class="repo-lang">${r.lang}</span>`; rp.append(a); });

  // robotics stack
  const stk = $("#stack"); stk.innerHTML = "";
  STACK.forEach(L => {
    const d = el("div", "stack-layer" + (L.mine ? " mine" : ""));
    d.innerHTML = `<div class="stack-side"><span class="lvl">${L.lvl}</span><h4>${pick(L, "name")}</h4>${L.mine ? `<span class="stack-mine-flag">◆ ${T().stack_mine}</span>` : ""}</div><div class="stack-body"><p>${pick(L, "desc")}</p><div class="stack-tools">${L.tools.map(t => `<span>${t}</span>`).join("")}</div></div>`;
    stk.append(d);
  });

  // project fallback
  const grid = $("#projFallback");
  if (grid && grid.dataset.filled) { grid.innerHTML = ""; PROJECTS.forEach(p => { const f = el("figure", "gItem"); f.innerHTML = `<img src="${IMG(p.id, "w480")}" alt="${pick(p, "title")}" loading="lazy"><figcaption>${pick(p, "title")}</figcaption>`; f.addEventListener("click", () => openProject(p)); grid.append(f); }); }

  // calisthenics
  const cal = $("#calList"); cal.innerHTML = "";
  (lang === "ar" ? CALISTHENICS.list_ar : CALISTHENICS.list).forEach(m => cal.append(el("span", null, m)));

  renderPubs(); renderMediaGrid();
  window.__cursorBind?.();
}

/* ════════════ PUBLICATIONS DATABASE ════════════ */
let pubFilter = { taxo: "all", year: "all", status: "all", q: "", sort: "year", dir: -1 };
function renderTaxo() {
  const row = $("#taxoRow"); row.innerHTML = "";
  TAXONOMY.forEach(tx => { const b = el("button", "taxo" + (pubFilter.taxo === tx.id ? " on" : ""), tx[lang]); b.addEventListener("click", () => { pubFilter.taxo = tx.id; renderTaxo(); renderPubs(); }); row.append(b); });
}
function buildSelects() {
  const ys = [...new Set(PUBS.map(p => p.year))].sort((a, b) => b - a);
  $("#pubYear").innerHTML = `<option value="all">${T().pubdb_allyears}</option>` + ys.map(y => `<option value="${y}">${y}</option>`).join("");
  $("#pubYear").value = pubFilter.year;
  const sts = [["all", T().pubdb_allstatus], ["published", T().st_published], ["accepted", T().st_accepted], ["review", T().st_review]];
  $("#pubStatus").innerHTML = sts.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
  $("#pubStatus").value = pubFilter.status;
  $("#pubSearch").placeholder = T().pubdb_search;
}
function renderPubs() {
  renderTaxo(); buildSelects();
  const body = $("#pubBody"); body.innerHTML = "";
  let rows = PUBS.filter(p =>
    (pubFilter.taxo === "all" || p.taxo === pubFilter.taxo) &&
    (pubFilter.year === "all" || String(p.year) === pubFilter.year) &&
    (pubFilter.status === "all" || p.status === pubFilter.status) &&
    (!pubFilter.q || (p.title + " " + p.venue + " " + p.tags.join(" ")).toLowerCase().includes(pubFilter.q)));
  rows.sort((a, b) => { let r = a[pubFilter.sort] > b[pubFilter.sort] ? 1 : a[pubFilter.sort] < b[pubFilter.sort] ? -1 : 0; return r * pubFilter.dir; });
  rows.forEach((p, i) => {
    const tr = el("tr", "pub-row");
    const stTxt = p.status === "published" ? T().st_published : p.status === "accepted" ? T().st_accepted : T().st_review;
    tr.innerHTML = `<td><div class="pub-title">${p.title}</div><div class="pub-venue">${p.venue}</div><div class="pub-tags">${p.tags.map(t => `<span>${t}</span>`).join("")}</div></td>
      <td>${p.year}</td>
      <td class="pub-hide-sm"><span class="pub-badge tx">${txEn(p.taxo)}</span></td>
      <td class="pub-hide-sm"><span class="pub-badge st-${p.status}">${stTxt}</span></td>
      <td class="pub-hide-sm">${p.doi ? `<a class="pub-doi" href="${p.doi}" target="_blank" rel="noopener" onclick="event.stopPropagation()">DOI ↗</a>` : "—"}</td>`;
    const ab = el("tr", "pub-abstract"); ab.innerHTML = `<td colspan="5"><div class="inner">${pick(p, "abstract")}</div></td>`;
    tr.addEventListener("click", () => ab.classList.toggle("open"));
    body.append(tr); body.append(ab);
  });
  $("#pubCount").textContent = `${rows.length} ${T().pubdb_count}`;
}
$("#pubSearch").addEventListener("input", e => { pubFilter.q = e.target.value.toLowerCase().trim(); renderPubs(); });
$("#pubYear").addEventListener("change", e => { pubFilter.year = e.target.value; renderPubs(); });
$("#pubStatus").addEventListener("change", e => { pubFilter.status = e.target.value; renderPubs(); });
$$("#pubdb th[data-sort]").forEach(th => th.addEventListener("click", () => { const k = th.dataset.sort; if (pubFilter.sort === k) pubFilter.dir *= -1; else { pubFilter.sort = k; pubFilter.dir = k === "year" ? -1 : 1; } renderPubs(); }));

/* ════════════ MEDIA COLLECTIONS ════════════ */
let MEDIA = null, mediaFilter = { type: "all", q: "", sort: "rating" };
async function initMedia() {
  if (MEDIA) return;
  try { MEDIA = await (await fetch("media.json")).json(); } catch { MEDIA = []; }
  const tabs = [["all", "m_all"], ["movie", "m_movie"], ["series", "m_series"], ["game", "m_game"], ["manga", "m_manga"]];
  const tw = $("#mediaTabs"); tw.innerHTML = "";
  tabs.forEach(([v, k]) => { const b = el("button", "media-tab" + (mediaFilter.type === v ? " on" : ""), T()[k]); b.dataset.type = v; b.addEventListener("click", () => { mediaFilter.type = v; $$("#mediaTabs .media-tab").forEach(x => x.classList.toggle("on", x.dataset.type === v)); renderMediaGrid(); }); tw.append(b); });
  $("#mediaSort").innerHTML = `<option value="rating">${T().m_sort_rating}</option><option value="year">${T().m_sort_year}</option>`;
  $("#mediaSearch").placeholder = T().pubdb_search;
  renderMediaGrid();
}
$("#mediaSearch")?.addEventListener("input", e => { mediaFilter.q = e.target.value.toLowerCase().trim(); renderMediaGrid(); });
$("#mediaSort")?.addEventListener("change", e => { mediaFilter.sort = e.target.value; renderMediaGrid(); });
function renderMediaGrid() {
  const g = $("#mediaGrid"); if (!g || !MEDIA) return;
  let items = MEDIA.filter(m => (mediaFilter.type === "all" || m.type === mediaFilter.type) && (!mediaFilter.q || m.title.toLowerCase().includes(mediaFilter.q)));
  items.sort((a, b) => mediaFilter.sort === "year" ? (b.year || "").localeCompare(a.year || "") : (b.rating - a.rating));
  g.innerHTML = "";
  items.forEach(m => {
    const c = el("article", "media-card");
    const poster = m.poster ? `<img class="media-poster" src="${m.poster}" alt="${m.title}" loading="lazy">` : `<div class="media-noposter">${m.title}</div>`;
    c.innerHTML = `${poster}<div class="media-meta"><h4>${m.title}</h4><div class="my"><span>${(m.year || "").split("–")[0]}</span>${m.rating ? `<span class="rt">★ ${m.rating}</span>` : ""}</div></div>`;
    if (m.url) { c.style.cursor = "pointer"; c.addEventListener("click", () => window.open(m.url, "_blank")); }
    g.append(c);
  });
  $("#mediaCount").textContent = `${items.length} ${T().m_count}`;
}

/* ════════════ STATIC i18n + lang ════════════ */
function applyStatic() {
  const t = T();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  $$("[data-i18n]").forEach(e => { const k = e.dataset.i18n; if (t[k] != null) e.textContent = t[k]; });
  $$("[data-i18n-ph]").forEach(e => { const k = e.dataset.i18nPh; if (t[k]) e.placeholder = t[k]; });
  $("#year").textContent = new Date().getFullYear();
}
function applyLang() { applyStatic(); renderDynamic(); requestAnimationFrame(() => ST.refresh()); }
$("#langToggle").addEventListener("click", () => { lang = lang === "en" ? "ar" : "en"; applyLang(); });

$("#cEmail").href = "mailto:" + PROFILE.email; $("#cEmail").textContent = PROFILE.email;
$("#cGithub").href = PROFILE.links.github; $("#cLinkedin").href = PROFILE.links.linkedin; $("#cScholar").href = PROFILE.links.scholar;

applyLang();

/* ════════════ MOTION ════════════ */
addEventListener("load", () => {
  const tl = gsap.timeline();
  tl.to("#loader", { yPercent: -100, duration: reduced ? 0 : 0.9, ease: "power4.inOut", delay: reduced ? 0 : 0.4 }).set("#loader", { display: "none" })
    .from(".hero-kicker", { y: 18, opacity: 0 }, "<0.1")
    .from(".hero-title .line", { yPercent: 115, stagger: 0.1, duration: 1.1 }, "<0.05")
    .from(".hero-sub", { y: 18, opacity: 0 }, "<0.4")
    .from(".hero-cta-row", { y: 18, opacity: 0 }, "<0.15")
    .from(".navbar", { y: -24, opacity: 0 }, "<");
});
$$(".reveal").forEach(e => gsap.from(e, { y: reduced ? 0 : 40, opacity: 0, duration: 1.0, scrollTrigger: { trigger: e, start: "top 88%" } }));
// stack stagger
gsap.from("#stack .stack-layer", { x: reduced ? 0 : -30, opacity: 0, stagger: 0.06, duration: 0.7, scrollTrigger: { trigger: "#stack", start: "top 80%" } });

// research path
(function () { const path = $("#tlPath"); if (!path) return; const len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = reduced ? 0 : len; if (reduced) return; ST.create({ trigger: "#research", start: "top 60%", end: "bottom 80%", scrub: 0.6, onUpdate: s => path.style.strokeDashoffset = len * (1 - s.progress) }); })();

// cinematic scrub hero
window.__CINEMATIC = { frameCount: 150, framePath: i => `frames/hero/frame_${String(i).padStart(4, "0")}.webp`, bg: "#16352a" };
initCinematic({ section: "#cine", lenis, reduced });

// sphere
const sphereWrap = $("#sphereWrap");
if (webglOK() && !reduced) {
  ST.create({ trigger: sphereWrap, start: "top 130%", once: true, onEnter: () => initSphere({ canvas: $("#sphereCanvas"), onPick: openProject, onHover: item => { const tag = $("#sphereTag"); if (item) { tag.textContent = pick(item, "title"); tag.classList.add("on"); } else tag.classList.remove("on"); }, reducedMotion: reduced }) });
} else { sphereWrap.classList.add("fallback"); $("#projFallback").dataset.filled = "1"; renderDynamic(); }

/* ── project panel + lightbox ── */
const panel = $("#projPanel");
function openProject(p) { $("#ppImg").src = IMG(p.id, "w1600"); $("#ppImg").alt = pick(p, "title"); $("#ppKind").textContent = pick(p, "kind") + " · " + p.year; $("#ppTitle").textContent = pick(p, "title"); $("#ppBlurb").textContent = pick(p, "blurb"); panel.classList.add("active"); document.body.style.overflow = "hidden"; lenis?.stop(); }
function closePanel() { panel.classList.remove("active"); document.body.style.overflow = ""; lenis?.start(); }
$("#ppClose").addEventListener("click", closePanel); panel.addEventListener("click", e => { if (e.target === panel) closePanel(); });

let lbItems = [], lbIdx = 0; const lb = $("#lightbox");
function openLightbox(items, idx) { lbItems = items; lbIdx = idx; renderLb(); lb.classList.add("active"); document.body.style.overflow = "hidden"; lenis?.stop(); }
function renderLb() { const it = lbItems[lbIdx]; $("#lbImg").src = IMG(it.id, "w1600"); $("#lbImg").alt = pick(it, "cap"); $("#lbCap").textContent = pick(it, "cap"); $("#lbCount").textContent = `${lbIdx + 1} / ${lbItems.length}`; }
function closeLb() { lb.classList.remove("active"); document.body.style.overflow = ""; lenis?.start(); }
const step = d => { lbIdx = (lbIdx + d + lbItems.length) % lbItems.length; renderLb(); };
$(".lb-close").addEventListener("click", closeLb); lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
$(".lb-prev").addEventListener("click", e => { e.stopPropagation(); step(-1); }); $(".lb-next").addEventListener("click", e => { e.stopPropagation(); step(1); });
addEventListener("keydown", e => { if (lb.classList.contains("active")) { if (e.key === "Escape") closeLb(); if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); } else if (panel.classList.contains("active") && e.key === "Escape") closePanel(); });

/* ── navbar ── */
function closeMenu() { $("#hamburger").classList.remove("active"); $("#navMenu").classList.remove("active"); }
addEventListener("scroll", () => $(".navbar").classList.toggle("scrolled", scrollY > 40), { passive: true });
$("#hamburger").addEventListener("click", () => { $("#hamburger").classList.toggle("active"); $("#navMenu").classList.toggle("active"); });

/* ── initial route ── */
if (location.hash === "#beyond") showPage("beyond");
