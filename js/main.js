/* Abdulrahman S. Al-Batati — portfolio motion core.
   Lenis · GSAP ScrollTrigger · P7 glowing research path · P4 project sphere ·
   galleries · project detail panel · custom cursor. */

import { PROFILE, STATS, PROJECTS, PAPERS, RESEARCH_SUMMARY, ROBOTS, PRINTS,
         PATENTS, EXPERIENCE, EDUCATION, SKILLS, REPOS, IMG } from "./data.js";
import { initSphere, webglOK } from "./sphere.js";

const gsap = window.gsap, ST = window.ScrollTrigger;
gsap.registerPlugin(ST);
gsap.defaults({ ease: "expo.out", duration: 1 });

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch = matchMedia("(pointer: coarse)").matches;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

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
  const bind = () => $$("a, button, .magnetic, #sphereCanvas, .card, .gItem").forEach(e => {
    e.addEventListener("pointerenter", () => ring.classList.add("on"));
    e.addEventListener("pointerleave", () => ring.classList.remove("on"));
  });
  addEventListener("load", () => setTimeout(bind, 400));
}

/* ── Magnetic buttons ── */
if (!touch && !reduced) {
  const wire = e => {
    e.addEventListener("pointermove", ev => {
      const r = e.getBoundingClientRect();
      gsap.to(e, { x: (ev.clientX - r.left - r.width / 2) * 0.3, y: (ev.clientY - r.top - r.height / 2) * 0.3, duration: 0.4 });
    });
    e.addEventListener("pointerleave", () => gsap.to(e, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.4)" }));
  };
  addEventListener("load", () => setTimeout(() => $$(".magnetic").forEach(wire), 400));
}

/* ════════════ POPULATE CONTENT ════════════ */
// stats
const statsWrap = $("#stats");
STATS.forEach(s => statsWrap.append(el("div", "stat", `<span class="stat-n">${s.n}</span><span class="stat-l">${s.label}</span>`)));

// languages
$("#langs").innerHTML = PROFILE.languages.map(l => `<span class="chip">${l}</span>`).join("");

// research timeline
const tl = $("#timeline");
PAPERS.forEach((p, i) => {
  const node = el("article", "tl-item" + (i % 2 ? " right" : ""));
  node.innerHTML = `
    <div class="tl-dot"></div>
    <div class="tl-card card">
      <span class="tl-year">${p.year}</span>
      <span class="tl-tag">${p.tag}</span>
      <h3>${p.title}</h3>
      <p class="tl-venue">${p.venue} · <em>${p.role}</em></p>
      <a class="tl-doi" href="${p.doi}" target="_blank" rel="noopener">DOI ↗</a>
    </div>`;
  tl.append(node);
});
$("#researchNote").textContent = RESEARCH_SUMMARY.note;

// galleries
function fillGallery(sel, items) {
  const g = $(sel);
  items.forEach((it, idx) => {
    const fig = el("figure", "gItem");
    fig.innerHTML = `<img src="${IMG(it.id, "w480")}" alt="${it.cap}" loading="lazy"><figcaption>${it.cap}</figcaption>`;
    fig.addEventListener("click", () => openLightbox(items, idx));
    g.append(fig);
  });
}
fillGallery("#robotsGrid", ROBOTS);
fillGallery("#printsGrid", PRINTS);

// patents
const pat = $("#patents");
PATENTS.forEach(p => {
  pat.append(el("article", "card patent",
    `<img src="${IMG(p.id, "w480")}" alt="${p.title}" loading="lazy"><div><span class="tl-year">${p.year}</span><h3>${p.title}</h3><p>${p.body}</p></div>`));
});

// experience + education
const exp = $("#experience");
EXPERIENCE.forEach(e => exp.append(el("div", "row",
  `<span class="row-when">${e.when}</span><div class="row-body"><h4>${e.role}</h4><p class="row-org">${e.org}</p><p class="row-note">${e.note}</p></div>`)));
const edu = $("#education");
EDUCATION.forEach(e => edu.append(el("div", "row",
  `<span class="row-when">${e.when}</span><div class="row-body"><h4>${e.deg}</h4><p class="row-org">${e.org}</p>${e.extra ? `<p class="row-note">${e.extra}</p>` : ""}</div>`)));

// skills
const sk = $("#skills");
SKILLS.forEach(g => sk.append(el("div", "skill-group card",
  `<h4>${g.group}</h4>` + g.items.map(i => `<span class="chip">${i}</span>`).join(""))));

// repos
const rp = $("#repos");
REPOS.forEach(r => {
  const a = el("a", "card repo");
  a.href = r.url; a.target = "_blank"; a.rel = "noopener";
  a.innerHTML = `<div class="repo-top"><span class="repo-name">${r.name}</span><span class="repo-star">★ ${r.stars}</span></div><p>${r.desc}</p><span class="repo-lang">${r.lang}</span>`;
  rp.append(a);
});

// contact links
$("#cEmail").href = "mailto:" + PROFILE.email;
$("#cEmail").textContent = PROFILE.email;
$("#cGithub").href = PROFILE.links.github;
$("#cLinkedin").href = PROFILE.links.linkedin;
$("#cScholar").href = PROFILE.links.scholar;
$("#year").textContent = new Date().getFullYear();

/* ════════════ MOTION ════════════ */
// loader → hero
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

// hero parallax
if (!reduced) gsap.to("#heroImg", {
  yPercent: 18, scale: 1.08, ease: "none",
  scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 1 },
});

// section reveals
$$(".reveal").forEach(e => gsap.from(e, {
  y: reduced ? 0 : 42, opacity: 0, duration: 1.05,
  scrollTrigger: { trigger: e, start: "top 86%" },
}));

// P7 glowing research path — SVG line draws with scroll
(function researchPath() {
  const path = $("#tlPath");
  if (!path) return;
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = reduced ? 0 : len;
  if (reduced) return;
  ST.create({
    trigger: "#research", start: "top 60%", end: "bottom 80%", scrub: 0.6,
    onUpdate: self => { path.style.strokeDashoffset = len * (1 - self.progress); },
  });
  $$(".tl-item").forEach(it => gsap.from(it, {
    opacity: 0, y: 40, duration: 0.9,
    scrollTrigger: { trigger: it, start: "top 85%" },
  }));
})();

// sphere
const sphereWrap = $("#sphereWrap");
if (webglOK() && !reduced) {
  ST.create({ trigger: sphereWrap, start: "top 130%", once: true, onEnter: () =>
    initSphere({
      canvas: $("#sphereCanvas"),
      onPick: openProject,
      onHover: t => { const tag = $("#sphereTag"); if (t) { tag.textContent = t; tag.classList.add("on"); } else tag.classList.remove("on"); },
      reducedMotion: reduced,
    })
  });
} else {
  sphereWrap.classList.add("fallback");
  const grid = $("#projFallback");
  PROJECTS.forEach(p => {
    const fig = el("figure", "gItem");
    fig.innerHTML = `<img src="${IMG(p.id, "w480")}" alt="${p.title}" loading="lazy"><figcaption>${p.title}</figcaption>`;
    fig.addEventListener("click", () => openProject(p));
    grid.append(fig);
  });
}

/* ── project detail panel ── */
const panel = $("#projPanel");
function openProject(p) {
  $("#ppImg").src = IMG(p.id, "w1600");
  $("#ppImg").alt = p.title;
  $("#ppKind").textContent = p.kind + " · " + p.year;
  $("#ppTitle").textContent = p.title;
  $("#ppBlurb").textContent = p.blurb;
  panel.classList.add("active");
  document.body.style.overflow = "hidden";
  lenis?.stop();
}
function closePanel() { panel.classList.remove("active"); document.body.style.overflow = ""; lenis?.start(); }
$("#ppClose").addEventListener("click", closePanel);
panel.addEventListener("click", e => { if (e.target === panel) closePanel(); });

/* ── lightbox (galleries) ── */
let lbItems = [], lbIdx = 0;
const lb = $("#lightbox");
function openLightbox(items, idx) {
  lbItems = items; lbIdx = idx; renderLb();
  lb.classList.add("active"); document.body.style.overflow = "hidden"; lenis?.stop();
}
function renderLb() {
  const it = lbItems[lbIdx];
  $("#lbImg").src = IMG(it.id, "w1600"); $("#lbImg").alt = it.cap;
  $("#lbCap").textContent = it.cap;
  $("#lbCount").textContent = `${lbIdx + 1} / ${lbItems.length}`;
}
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
