/* Abdulrahman S. Al-Batati — portfolio motion core (bilingual EN/AR).
   Lenis · GSAP ScrollTrigger · P7 glowing research path · P4 project sphere ·
   scroll-scrubbed cinematic hero · galleries · detail panel · cursor · i18n. */

import { PROFILE, STATS, PROJECTS, PAPERS, RESEARCH_NOTE, RESEARCH_NOTE_AR, ROBOTS, PRINTS,
         PATENTS, EXPERIENCE, EDUCATION, SKILLS, REPOS, I18N, IMG } from "./data.js";
import { initSphere, webglOK } from "./sphere.js";
import { initCinematic } from "./cinematic.js";

const gsap = window.gsap, ST = window.ScrollTrigger;
gsap.registerPlugin(ST);
gsap.defaults({ ease: "expo.out", duration: 1 });

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch = matchMedia("(pointer: coarse)").matches;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

let lang = "en";
const T = () => I18N[lang];
const pick = (o, key) => (lang === "ar" ? (o[key + "_ar"] ?? o[key]) : o[key]);

/* ── Lenis ── */
let lenis = null;
if (!reduced) {
  lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
  window.__lenis = lenis;
  lenis.on("scroll", ST.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ── Custom cursor ── */
if (!touch && !reduced) {
  const dot = $("#cursorDot"), ring = $("#cursorRing");
  let rx = -100, ry = -100;
  addEventListener("pointermove", e => {
    gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1, overwrite: "auto" });
    rx = e.clientX; ry = e.clientY;
  }, { passive: true });
  gsap.ticker.add(() => {
    const x = gsap.getProperty(ring, "x"), y = gsap.getProperty(ring, "y");
    gsap.set(ring, { x: x + (rx - x) * 0.16, y: y + (ry - y) * 0.16 });
  });
  document.body.classList.add("hasCursor");
  window.__cursorBind = () => $$("a, button, .magnetic, #sphereCanvas, .gItem").forEach(e => {
    if (e.__cb) return; e.__cb = 1;
    e.addEventListener("pointerenter", () => ring.classList.add("on"));
    e.addEventListener("pointerleave", () => ring.classList.remove("on"));
  });
}

/* ── Magnetic buttons (bind once, persistent elements) ── */
if (!touch && !reduced) addEventListener("load", () => setTimeout(() => $$(".magnetic").forEach(e => {
  e.addEventListener("pointermove", ev => {
    const r = e.getBoundingClientRect();
    gsap.to(e, { x: (ev.clientX - r.left - r.width / 2) * 0.3, y: (ev.clientY - r.top - r.height / 2) * 0.3, duration: 0.4 });
  });
  e.addEventListener("pointerleave", () => gsap.to(e, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.4)" }));
}), 400));

/* ════════════ RENDER (re-runnable for language toggle) ════════════ */
function renderDynamic() {
  // stats
  const statsWrap = $("#stats"); statsWrap.innerHTML = "";
  STATS.forEach(s => statsWrap.append(el("div", "stat", `<span class="stat-n">${s.n}</span><span class="stat-l">${pick(s, "label")}</span>`)));

  // languages
  $("#langs").innerHTML = (lang === "ar" ? PROFILE.languages_ar : PROFILE.languages).map(l => `<span class="chip">${l}</span>`).join("");

  // research timeline
  const tl = $("#timeline"); tl.innerHTML = "";
  PAPERS.forEach((p, i) => {
    const node = el("article", "tl-item" + (i % 2 ? " right" : ""));
    node.innerHTML = `
      <div class="tl-dot"></div>
      <div class="tl-card card">
        <span class="tl-year">${p.year}</span>
        <span class="tl-tag">${p.tag}</span>
        <h3>${p.title}</h3>
        <p class="tl-venue">${p.venue} · <em>${pick(p, "role")}</em></p>
        <a class="tl-doi" href="${p.doi}" target="_blank" rel="noopener">DOI ↗</a>
      </div>`;
    tl.append(node);
  });
  $("#researchNote").textContent = lang === "ar" ? RESEARCH_NOTE_AR : RESEARCH_NOTE;

  // galleries
  const fillGallery = (sel, items) => {
    const g = $(sel); g.innerHTML = "";
    items.forEach((it, idx) => {
      const cap = pick(it, "cap");
      const fig = el("figure", "gItem");
      fig.innerHTML = `<img src="${IMG(it.id, "w480")}" alt="${cap}" loading="lazy"><figcaption>${cap}</figcaption>`;
      fig.addEventListener("click", () => openLightbox(items, idx));
      g.append(fig);
    });
  };
  fillGallery("#robotsGrid", ROBOTS);
  fillGallery("#printsGrid", PRINTS);

  // patents
  const pat = $("#patents"); pat.innerHTML = "";
  PATENTS.forEach(p => pat.append(el("article", "card patent",
    `<img src="${IMG(p.id, "w480")}" alt="${pick(p, "title")}" loading="lazy"><div><span class="tl-year">${p.year}</span><h3>${pick(p, "title")}</h3><p>${pick(p, "body")}</p></div>`)));

  // experience + education
  const exp = $("#experience"); exp.innerHTML = "";
  EXPERIENCE.forEach(e => exp.append(el("div", "row",
    `<span class="row-when">${pick(e, "when")}</span><div class="row-body"><h4>${pick(e, "role")}</h4><p class="row-org">${pick(e, "org")}</p><p class="row-note">${pick(e, "note")}</p></div>`)));
  const edu = $("#education"); edu.innerHTML = "";
  EDUCATION.forEach(e => edu.append(el("div", "row",
    `<span class="row-when">${pick(e, "when")}</span><div class="row-body"><h4>${pick(e, "deg")}</h4><p class="row-org">${pick(e, "org")}</p>${pick(e, "extra") ? `<p class="row-note">${pick(e, "extra")}</p>` : ""}</div>`)));

  // skills
  const sk = $("#skills"); sk.innerHTML = "";
  SKILLS.forEach(g => sk.append(el("div", "skill-group card",
    `<h4>${pick(g, "group")}</h4>` + (lang === "ar" ? g.items_ar : g.items).map(i => `<span class="chip">${i}</span>`).join(""))));

  // repos
  const rp = $("#repos"); rp.innerHTML = "";
  REPOS.forEach(r => {
    const a = el("a", "card repo");
    a.href = r.url; a.target = "_blank"; a.rel = "noopener";
    a.innerHTML = `<div class="repo-top"><span class="repo-name">${r.name}</span><span class="repo-star">★ ${r.stars}</span></div><p>${pick(r, "desc")}</p><span class="repo-lang">${r.lang}</span>`;
    rp.append(a);
  });

  // project fallback grid (only if present)
  const grid = $("#projFallback");
  if (grid && grid.dataset.filled) {
    grid.innerHTML = "";
    PROJECTS.forEach(p => {
      const fig = el("figure", "gItem");
      fig.innerHTML = `<img src="${IMG(p.id, "w480")}" alt="${pick(p, "title")}" loading="lazy"><figcaption>${pick(p, "title")}</figcaption>`;
      fig.addEventListener("click", () => openProject(p));
      grid.append(fig);
    });
  }

  window.__cursorBind?.();
}

function applyStatic() {
  const t = T();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  $$("[data-i18n]").forEach(e => { const k = e.dataset.i18n; if (t[k] != null) e.textContent = t[k]; });
  $$("[data-i18n-aria]").forEach(e => { const k = e.dataset.i18nAria; if (t[k]) e.setAttribute("aria-label", t[k]); });
  $("#year").textContent = new Date().getFullYear();
}

function applyLang() { applyStatic(); renderDynamic(); requestAnimationFrame(() => ST.refresh()); }

$("#langToggle").addEventListener("click", () => { lang = lang === "en" ? "ar" : "en"; applyLang(); });

// contact links (static hrefs)
$("#cEmail").href = "mailto:" + PROFILE.email; $("#cEmail").textContent = PROFILE.email;
$("#cGithub").href = PROFILE.links.github;
$("#cLinkedin").href = PROFILE.links.linkedin;
$("#cScholar").href = PROFILE.links.scholar;

applyLang(); // initial render (en)

/* ════════════ MOTION ════════════ */
const heroLines = $$(".hero-title .line");
function intro() {
  const tl = gsap.timeline();
  tl.to("#loader", { yPercent: -100, duration: reduced ? 0 : 0.9, ease: "power4.inOut", delay: reduced ? 0 : 0.4 })
    .set("#loader", { display: "none" })
    .from(".hero-kicker", { y: 20, opacity: 0 }, "<0.1")
    .from(heroLines, { yPercent: 115, stagger: 0.1, duration: 1.1 }, "<0.05")
    .from(".hero-sub", { y: 20, opacity: 0 }, "<0.4")
    .from(".hero-cta-row", { y: 20, opacity: 0 }, "<0.15")
    .from(".navbar", { y: -24, opacity: 0 }, "<")
    .from("#stats .stat", { y: 24, opacity: 0, stagger: 0.08 }, "<0.1");
}
addEventListener("load", intro);

// section reveals
$$(".reveal").forEach(e => gsap.from(e, {
  y: reduced ? 0 : 42, opacity: 0, duration: 1.05,
  scrollTrigger: { trigger: e, start: "top 86%" },
}));

// P7 glowing research path
(function researchPath() {
  const path = $("#tlPath"); if (!path) return;
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = reduced ? 0 : len;
  if (reduced) return;
  ST.create({ trigger: "#research", start: "top 60%", end: "bottom 80%", scrub: 0.6,
    onUpdate: self => { path.style.strokeDashoffset = len * (1 - self.progress); } });
})();

// project sphere
const sphereWrap = $("#sphereWrap");
if (webglOK() && !reduced) {
  ST.create({ trigger: sphereWrap, start: "top 130%", once: true, onEnter: () =>
    initSphere({
      canvas: $("#sphereCanvas"),
      onPick: openProject,
      onHover: item => { const tag = $("#sphereTag"); if (item) { tag.textContent = pick(item, "title"); tag.classList.add("on"); } else tag.classList.remove("on"); },
      reducedMotion: reduced,
    }) });
} else {
  sphereWrap.classList.add("fallback");
  $("#projFallback").dataset.filled = "1";
  renderDynamic();
}

// cinematic hero scrub (frames present? cinematic.js no-ops gracefully if not)
initCinematic({ section: "#cinematic", lenis, reduced });

/* ── project detail panel ── */
const panel = $("#projPanel");
function openProject(p) {
  $("#ppImg").src = IMG(p.id, "w1600"); $("#ppImg").alt = pick(p, "title");
  $("#ppKind").textContent = pick(p, "kind") + " · " + p.year;
  $("#ppTitle").textContent = pick(p, "title");
  $("#ppBlurb").textContent = pick(p, "blurb");
  panel.classList.add("active"); document.body.style.overflow = "hidden"; lenis?.stop();
}
function closePanel() { panel.classList.remove("active"); document.body.style.overflow = ""; lenis?.start(); }
$("#ppClose").addEventListener("click", closePanel);
panel.addEventListener("click", e => { if (e.target === panel) closePanel(); });

/* ── lightbox ── */
let lbItems = [], lbIdx = 0;
const lb = $("#lightbox");
function openLightbox(items, idx) { lbItems = items; lbIdx = idx; renderLb(); lb.classList.add("active"); document.body.style.overflow = "hidden"; lenis?.stop(); }
function renderLb() { const it = lbItems[lbIdx]; $("#lbImg").src = IMG(it.id, "w1600"); $("#lbImg").alt = pick(it, "cap"); $("#lbCap").textContent = pick(it, "cap"); $("#lbCount").textContent = `${lbIdx + 1} / ${lbItems.length}`; }
function closeLb() { lb.classList.remove("active"); document.body.style.overflow = ""; lenis?.start(); }
const step = d => { lbIdx = (lbIdx + d + lbItems.length) % lbItems.length; renderLb(); };
$(".lb-close").addEventListener("click", closeLb);
lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
$(".lb-prev").addEventListener("click", e => { e.stopPropagation(); step(-1); });
$(".lb-next").addEventListener("click", e => { e.stopPropagation(); step(1); });
addEventListener("keydown", e => {
  if (lb.classList.contains("active")) {
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  } else if (panel.classList.contains("active") && e.key === "Escape") closePanel();
});

/* ── navbar + mobile menu ── */
addEventListener("scroll", () => $(".navbar").classList.toggle("scrolled", scrollY > 40), { passive: true });
$("#hamburger").addEventListener("click", () => { $("#hamburger").classList.toggle("active"); $("#navMenu").classList.toggle("active"); });
$$("#navMenu a").forEach(a => a.addEventListener("click", () => { $("#hamburger").classList.remove("active"); $("#navMenu").classList.remove("active"); }));
