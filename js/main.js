/* Abdulrahman S. Al-Batati — portfolio v8 (light, bilingual, multi-page).
   Router · static/animated hero · Home (journey path + research teaser) ·
   Research (interests map + robot architecture + publications DB) ·
   Projects (filterable showcase + patents + hardware + skills + repos) ·
   interactive interests Gallery · markdown blog · i18n. */

import { PROFILE, STATS, PROJECTS, JOURNEY, ROBOTS, PRINTS, PATENTS, SKILLS, REPOS,
         PUBS, TAXONOMY, ARCH, RESEARCH_MAP, RESEARCH_NOTE, RESEARCH_NOTE_AR,
         CALISTHENICS, I18N, IMG } from "./data.js";
import { renderGallery } from "./gallery.js";

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
// scroll-trigger handles wired lazily per page — declared up here so the
// first applyLang() (which calls wireJourneyPath) never hits their TDZ.
let journeyST = null, flowSTs = [];

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
  window.__cursorBind = () => $$("a, button, .magnetic, .gItem, .flow-card, .cat-card, .ring-card, .article-card, .pub-row, .proj-card, .focus-card, .rm-card").forEach(e => {
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
  if (name === "articles") renderArticles();
  if (name === "gallery") galleryCtx();
  if (name === "projects") wireFlow();
  if (name === "home") wireJourneyPath();
  requestAnimationFrame(() => { ST.refresh(); revealIn("#page-" + name); });
}
$$("[data-nav]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); showPage(a.dataset.nav); closeMenu(); }));
$$("[data-scroll]").forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  if (!$("#page-home").classList.contains("active")) { showPage("home"); requestAnimationFrame(() => go(a.dataset.scroll)); }
  else go(a.dataset.scroll);
  closeMenu();
  function go(sel) { const t = $(sel); if (t) lenis ? lenis.scrollTo(t, { offset: -60 }) : t.scrollIntoView(); }
}));
// re-run reveals for the freshly shown page (elements were display:none, so triggers didn't fire)
function revealIn(pageSel) {
  $$(`${pageSel} .reveal`).forEach(e => { if (getComputedStyle(e).opacity === "0") gsap.to(e, { y: 0, opacity: 1, duration: 0.8 }); });
}

/* ════════════ RENDER (re-runnable) ════════════ */
function renderDynamic() {
  const statsW = $("#stats"); statsW.innerHTML = "";
  STATS.forEach(s => statsW.append(el("div", "stat", `<span class="stat-n">${s.n}</span><span class="stat-l">${pick(s, "label")}</span>`)));
  $("#langs").innerHTML = (lang === "ar" ? PROFILE.languages_ar : PROFILE.languages).map(l => `<span class="chip">${l}</span>`).join("");

  renderJourney();
  renderFocus();
  renderResearchMap();
  renderArch();
  renderProjects();

  // hardware flow gallery (rows drift with scroll)
  const flow = (sel, items) => {
    const g = $(sel); g.innerHTML = "";
    items.forEach((it, idx) => {
      const cap = pick(it, "cap");
      const f = el("figure", "flow-card");
      f.innerHTML = `<img src="${IMG(it.id, "w480")}" alt="${cap}" loading="lazy"><figcaption>${cap}</figcaption>`;
      f.addEventListener("click", () => openLightbox(items, idx));
      g.append(f);
    });
  };
  flow("#flowRobots", ROBOTS); flow("#flowPrints", [...PRINTS, PATENTS[0]].map(p => ({ id: p.id, cap: p.cap ?? p.title, cap_ar: p.cap_ar ?? p.title_ar })));

  // patents
  const pat = $("#patents"); pat.innerHTML = "";
  PATENTS.forEach(p => pat.append(el("article", "card patent", `<img src="${IMG(p.id, "w480")}" alt="${pick(p, "title")}" loading="lazy"><div><span class="tl-year">${p.year}</span><h3>${pick(p, "title")}</h3><p>${pick(p, "body")}</p></div>`)));

  // skills
  const sk = $("#skills"); sk.innerHTML = "";
  SKILLS.forEach(g => sk.append(el("div", "skill-group card", `<h4>${pick(g, "group")}</h4><div class="chips-wrap">` + (lang === "ar" ? g.items_ar : g.items).map(i => `<span class="chip">${i}</span>`).join("") + "</div>")));

  // repos
  const rp = $("#repos"); rp.innerHTML = "";
  REPOS.forEach(r => { const a = el("a", "card repo"); a.href = r.url; a.target = "_blank"; a.rel = "noopener"; a.innerHTML = `<div class="repo-top"><span class="repo-name">${r.name}</span><span class="repo-star">★ ${r.stars}</span></div><p>${pick(r, "desc")}</p><span class="repo-lang">${r.lang}</span>`; rp.append(a); });

  // calisthenics
  const cal = $("#calList"); cal.innerHTML = "";
  (lang === "ar" ? CALISTHENICS.list_ar : CALISTHENICS.list).forEach(m => cal.append(el("span", null, m)));

  renderPubs();
  window.__cursorBind?.();
}

/* ── The path so far: education + career journey (Home) ── */
function renderJourney() {
  const tl = $("#journey"); if (!tl) return; tl.innerHTML = "";
  const kindLabel = { edu: T().j_edu, work: T().j_work, milestone: T().j_milestone, next: T().j_next };
  JOURNEY.forEach((j, i) => {
    const n = el("article", `tl-item j-${j.kind}` + (i % 2 ? " right" : ""));
    n.innerHTML = `<div class="tl-dot"></div><div class="tl-card card">
      <span class="tl-year">${j.year}</span><span class="tl-tag j-tag-${j.kind}">${kindLabel[j.kind] || pick(j, "tag")}</span>
      <h3>${pick(j, "title")}</h3><p class="tl-org">${pick(j, "org")}</p><p class="tl-note">${pick(j, "note")}</p></div>`;
    tl.append(n);
  });
}

/* ── Home research teaser cards → Research page ── */
function renderFocus() {
  const host = $("#focusCards"); if (!host) return; host.innerHTML = "";
  RESEARCH_MAP.domains.forEach(d => {
    const c = el("article", "focus-card");
    c.style.setProperty("--c", d.color);
    c.innerHTML = `<span class="fc-dot"></span><h3>${pick(d, "label")}</h3>
      <p>${(lang === "ar" ? d.topics_ar : d.topics).join(" · ")}</p>`;
    c.addEventListener("click", () => showPage("research"));
    host.append(c);
  });
}

/* ════════════ RESEARCH-INTERESTS MAP (Ramy-style overlapping fields) ════════════ */
const RM_POS = {
  tl: { card: [24, 34, 300, 150], circle: [340, 250], link: [324, 150] },
  tr: { card: [636, 34, 300, 150], circle: [620, 250], link: [636, 150] },
  bl: { card: [24, 436, 300, 150], circle: [340, 372], link: [324, 470] },
  br: { card: [636, 436, 300, 150], circle: [620, 372], link: [636, 470] },
};
function renderResearchMap() {
  const host = $("#researchMap"); if (!host) return;
  const HUB = [480, 310], R = 200;
  const circles = RESEARCH_MAP.domains.map(d => {
    const [cx, cy] = RM_POS[d.pos].circle;
    return `<circle class="rm-circle" id="rmc-${d.id}" cx="${cx}" cy="${cy}" r="${R}" style="--c:${d.color}"/>`;
  }).join("");
  const links = RESEARCH_MAP.domains.map(d => {
    const [lx, ly] = RM_POS[d.pos].link;
    return `<line class="rm-link" id="rml-${d.id}" x1="${HUB[0]}" y1="${HUB[1]}" x2="${lx}" y2="${ly}"/>`;
  }).join("");
  const hub = `<foreignObject x="${HUB[0] - 92}" y="${HUB[1] - 62}" width="184" height="124">
      <div xmlns="http://www.w3.org/1999/xhtml" class="rm-hub"><b>${pick(RESEARCH_MAP.center, "label")}</b><span>${pick(RESEARCH_MAP.center, "sub")}</span></div>
    </foreignObject>`;
  const cards = RESEARCH_MAP.domains.map(d => {
    const [x, y, w, h] = RM_POS[d.pos].card;
    const chips = (lang === "ar" ? d.topics_ar : d.topics).map(t => `<span>${t}</span>`).join("");
    return `<foreignObject x="${x}" y="${y}" width="${w}" height="${h}">
      <div xmlns="http://www.w3.org/1999/xhtml" class="rm-card" data-dom="${d.id}" style="--c:${d.color}">
        <b>${pick(d, "label")}</b><div class="rm-chips">${chips}</div></div></foreignObject>`;
  }).join("");
  host.innerHTML = `<svg viewBox="0 0 960 620" class="rm-svg" role="img" aria-label="${pick(RESEARCH_MAP.center, "label")}">
    <g class="rm-circles">${circles}</g><g class="rm-links">${links}</g>${hub}${cards}</svg>`;

  const cap = $("#rmCaption");
  const reset = () => { cap.textContent = T().rm_hint; cap.classList.remove("on"); host.querySelectorAll(".rm-circle,.rm-card,.rm-link").forEach(e => e.classList.remove("dim", "hi")); };
  RESEARCH_MAP.domains.forEach(d => {
    const card = host.querySelector(`.rm-card[data-dom="${d.id}"]`);
    const enter = () => {
      cap.innerHTML = `<b style="color:${d.color}">${pick(d, "label")}:</b> ${pick(d, "work")}`;
      cap.classList.add("on");
      host.querySelectorAll(".rm-circle").forEach(c => c.classList.toggle("dim", c.id !== `rmc-${d.id}`));
      host.querySelector(`#rmc-${d.id}`).classList.add("hi");
      host.querySelector(`#rml-${d.id}`).classList.add("hi");
    };
    card.addEventListener("pointerenter", enter);
    host.querySelector(`#rmc-${d.id}`).addEventListener("pointerenter", enter);
    card.addEventListener("click", enter);
  });
  host.addEventListener("pointerleave", reset);
  reset();

  // platform chips
  const plat = $("#rmPlatforms"); if (plat) {
    plat.innerHTML = `<span class="rm-plabel">${T().rm_platforms}</span>` +
      RESEARCH_MAP.platforms.map(p => `<span class="rm-pchip">${pick(p, "label")}</span>`).join("");
  }
}

/* ════════════ PROJECTS showcase (filterable grid) ════════════ */
let projCat = "all";
const PROJ_CATS = () => [["all", T().proj_all], ["aerial", T().proj_aerial], ["ground", T().proj_ground], ["sensor", T().proj_sensor]];
function renderProjects() {
  const fr = $("#projFilter"); if (!fr) return; fr.innerHTML = "";
  PROJ_CATS().forEach(([v, label]) => {
    const b = el("button", "proj-chip" + (projCat === v ? " on" : ""), label);
    b.addEventListener("click", () => { projCat = v; renderProjects(); });
    fr.append(b);
  });
  const grid = $("#projGrid"); grid.innerHTML = "";
  PROJECTS.filter(p => projCat === "all" || p.cat === projCat).forEach(p => {
    const c = el("article", "proj-card");
    c.innerHTML = `<div class="proj-cover"><img src="${IMG(p.id, "w480")}" alt="${pick(p, "title")}" loading="lazy"><span class="proj-cat">${pick(p, "kind")}</span></div>
      <div class="proj-body"><div class="proj-top"><h3>${pick(p, "title")}</h3><span class="proj-year">${p.year}</span></div>
        <p>${pick(p, "blurb")}</p><span class="proj-open">${T().proj_view} →</span></div>`;
    c.addEventListener("click", () => openProject(p));
    grid.append(c);
  });
  window.__cursorBind?.();
}

/* ════════════ ROBOTICS ARCHITECTURE (closed-loop model) ════════════ */
function renderArch() {
  const host = $("#arch"); if (!host) return;
  const N = ARCH.nodes;
  const box = {
    semantic: [64, 96, 222, 84], spatial: [64, 200, 222, 84], stateest: [64, 304, 222, 84],
    task: [636, 96, 210, 84], motion: [636, 200, 210, 84], control: [636, 304, 210, 84],
    world: [356, 108, 210, 280], super: [866, 96, 128, 292],
    sensors: [64, 430, 222, 84], actuators: [636, 430, 210, 84], env: [64, 556, 782, 64],
  };
  const fo = id => {
    const b = box[id], n = N[id];
    const cls = `arch-node ${n.col}${n.mine ? " mine" : ""}`;
    return `<foreignObject x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}">`
      + `<div xmlns="http://www.w3.org/1999/xhtml" class="${cls}">`
      + (n.mine ? `<span class="arch-dot" title="${T().stack_mine}"></span>` : "")
      + `<span class="arch-n-label">${pick(n, "label")}</span>`
      + `<span class="arch-n-sub">${pick(n, "sub")}</span></div></foreignObject>`;
  };
  const path = (d, cls) => `<path d="${d}" class="${cls}" fill="none"/>`;
  const bands = [["delib", 92, 138], ["react", 196, 242], ["reflex", 300, 346]];
  const stripes = bands.map(([id, y]) => `<rect x="58" y="${y}" width="790" height="92" rx="12" class="arch-band ${id}"/>`).join("");
  const timing = bands.map(([id, y, cy], i) => {
    const bd = ARCH.bands[i];
    return `<foreignObject x="2" y="${cy - 24}" width="54" height="48"><div xmlns="http://www.w3.org/1999/xhtml" class="arch-time"><b>${pick(bd, "label")}</b><span>${bd.rate}</span></div></foreignObject>`;
  }).join("");
  const flow = [
    "M175,556 L175,514", "M175,430 L175,388", "M175,304 L175,284", "M175,200 L175,180",
    "M741,180 L741,200", "M741,284 L741,304", "M741,388 L741,430", "M741,514 L741,556",
  ].map(d => path(d, "arch-flow")).join("");
  const share = ["M286,138 L356,138", "M286,242 L356,242", "M566,138 L636,138", "M566,242 L636,242"].map(d => path(d, "arch-share")).join("");
  const emerg = path("M286,258 L320,258 L320,410 L600,410 L600,346 L636,346", "arch-emerg");
  const propr = path("M741,514 L741,536 L336,536 L336,346 L286,346", "arch-react");
  const sup = ["M846,138 L866,138", "M846,242 L866,242", "M846,346 L866,346"].map(d => path(d, "arch-super")).join("");
  const nodes = Object.keys(box).map(fo).join("");
  const labels = `<text x="175" y="80" class="arch-coltitle">${T().arch_perc}</text>`
    + `<text x="741" y="80" class="arch-coltitle">${T().arch_cog}</text>`;
  const svg = `<svg viewBox="0 0 1000 660" class="arch-svg" role="img" aria-label="${T().arch_aria}">
    <defs>
      <marker id="ar-flow" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" class="m-flow"/></marker>
      <marker id="ar-share" markerWidth="8" markerHeight="8" refX="5.5" refY="2.6" orient="auto"><path d="M0,0 L6,2.6 L0,5.2 Z" class="m-share"/></marker>
      <marker id="ar-react" markerWidth="8" markerHeight="8" refX="5.5" refY="2.6" orient="auto"><path d="M0,0 L6,2.6 L0,5.2 Z" class="m-react"/></marker>
      <marker id="ar-emerg" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" class="m-emerg"/></marker>
      <marker id="ar-sup" markerWidth="8" markerHeight="8" refX="5.5" refY="2.6" orient="auto"><path d="M0,0 L6,2.6 L0,5.2 Z" class="m-sup"/></marker>
    </defs>
    ${stripes}${timing}${labels}
    <g class="g-flow">${flow}</g><g class="g-share">${share}</g>
    <g class="g-react">${propr}</g><g class="g-emerg">${emerg}</g><g class="g-sup">${sup}</g>
    <text x="455" y="404" class="arch-edgelabel emerg">${ARCH.legend[3][lang === "ar" ? "label_ar" : "label"]}</text>
    <text x="455" y="530" class="arch-edgelabel">${ARCH.legend[2][lang === "ar" ? "label_ar" : "label"]}</text>
    ${nodes}
  </svg>`;
  const legend = `<div class="arch-legend">` + ARCH.legend.map(l =>
    `<span class="le-${l.id}"><i></i>${l[lang === "ar" ? "label_ar" : "label"]}</span>`).join("")
    + `<span class="le-mine"><i></i>${T().stack_legend_mine}</span></div>`;
  host.innerHTML = svg + legend;
  const sim = $("#archSim"); if (sim) sim.textContent = pick(ARCH, "sim");
  const cards = $("#archCards"); if (cards) {
    const order = ["semantic", "spatial", "stateest", "motion", "task", "control", "super", "sensors"];
    cards.innerHTML = order.filter(k => N[k] && N[k].mine).map(k => {
      const n = N[k];
      return `<article class="arch-card"><h4>${pick(n, "label")}</h4>`
        + `<p class="arch-card-work">${pick(n, "work")}</p>`
        + `<div class="arch-papers">${(n.papers || []).map(p => `<span>${p}</span>`).join("")}</div></article>`;
    }).join("");
  }
}

/* ════════════ PUBLICATIONS DATABASE ════════════ */
const ST_LABEL = s => ({ published: T().st_published, accepted: T().st_accepted, review: T().st_review, progress: T().st_progress }[s] || s);
const ST_ORDER = { published: 0, accepted: 1, review: 2, progress: 3 };
const CONTRIB = p => {
  const r = (p.role || "").toLowerCase();
  if (/equal/.test(r)) return { key: "equal", label: T().role_equal };
  if (/1st|first|lead/.test(r)) return { key: "first", label: T().role_first };
  return { key: "co", label: T().role_co };
};
let pubFilter = { taxo: "all", type: "all", year: "all", status: "all", q: "", sort: null, dir: 1 };
function renderTaxo() {
  const row = $("#taxoRow"); row.innerHTML = "";
  TAXONOMY.forEach(tx => { const b = el("button", "taxo" + (pubFilter.taxo === tx.id ? " on" : ""), tx[lang]); b.addEventListener("click", () => { pubFilter.taxo = tx.id; renderTaxo(); renderPubs(); }); row.append(b); });
}
function buildSelects() {
  const ys = [...new Set(PUBS.map(p => p.year))].sort((a, b) => b - a);
  $("#pubYear").innerHTML = `<option value="all">${T().pubdb_allyears}</option>` + ys.map(y => `<option value="${y}">${y}</option>`).join("");
  $("#pubYear").value = pubFilter.year;
  const tps = [...new Set(PUBS.map(p => p.type))];
  $("#pubType").innerHTML = `<option value="all">${T().pubdb_alltype}</option>` + tps.map(t => `<option value="${t}">${t}</option>`).join("");
  $("#pubType").value = pubFilter.type;
  const sts = [["all", T().pubdb_allstatus], ["published", T().st_published], ["accepted", T().st_accepted], ["review", T().st_review], ["progress", T().st_progress]];
  $("#pubStatus").innerHTML = sts.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
  $("#pubStatus").value = pubFilter.status;
  $("#pubSearch").placeholder = T().pubdb_search;
}
function renderPubs() {
  renderTaxo(); buildSelects();
  const body = $("#pubBody"); body.innerHTML = "";
  let rows = PUBS.map((p, i) => ({ p, i })).filter(({ p }) =>
    (pubFilter.taxo === "all" || p.taxo === pubFilter.taxo) &&
    (pubFilter.type === "all" || p.type === pubFilter.type) &&
    (pubFilter.year === "all" || String(p.year) === pubFilter.year) &&
    (pubFilter.status === "all" || p.status === pubFilter.status) &&
    (!pubFilter.q || (p.title + " " + p.venue + " " + p.tags.join(" ")).toLowerCase().includes(pubFilter.q)));
  if (pubFilter.sort) {
    const key = pubFilter.sort;
    rows.sort((a, b) => { const x = a.p[key] ?? "", y = b.p[key] ?? ""; return (x > y ? 1 : x < y ? -1 : 0) * pubFilter.dir; });
  } else {
    rows.sort((a, b) => (ST_ORDER[a.p.status] - ST_ORDER[b.p.status]) || (b.p.year - a.p.year) || (a.i - b.i));
  }
  rows.forEach(({ p }) => {
    const tr = el("tr", "pub-row");
    const rankBadge = p.rank ? `<span class="pub-rank">${p.rank}${p.impact ? ` · IF ${p.impact}` : ""}</span>` : (p.impact ? `<span class="pub-rank">IF ${p.impact}</span>` : "—");
    const ci = CONTRIB(p);
    tr.innerHTML = `<td><div class="pub-title">${p.title}</div><div class="pub-venue">${p.venue}</div><div class="pub-tags"><span class="pub-area">${txEn(p.taxo)}</span>${p.tags.map(t => `<span>${t}</span>`).join("")}</div></td>
      <td><span class="pub-contrib c-${ci.key}">${ci.label}</span></td>
      <td>${p.type}</td>
      <td><span class="pub-badge st-${p.status}">${ST_LABEL(p.status)}</span></td>
      <td>${rankBadge}</td>
      <td>${p.year}</td>
      <td class="pub-links">${p.doi ? `<a class="pub-doi" href="${p.doi}" target="_blank" rel="noopener" onclick="event.stopPropagation()">DOI ↗</a>` : "—"}</td>
      <td class="pub-links">${p.project ? `<a class="pub-proj" href="${p.project}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${T().pub_page}</a>` : "—"}</td>`;
    const ab = el("tr", "pub-abstract");
    const bib = p.bibtex ? `<button class="pub-bibtex-btn">${T().pub_copy}</button><pre class="pub-bibtex">${p.bibtex.replace(/</g, "&lt;")}</pre>` : "";
    ab.innerHTML = `<td colspan="8"><div class="inner"><p>${pick(p, "abstract")}</p>${bib}</div></td>`;
    tr.addEventListener("click", () => ab.classList.toggle("open"));
    if (p.bibtex) ab.querySelector(".pub-bibtex-btn").addEventListener("click", e => { e.stopPropagation(); navigator.clipboard?.writeText(p.bibtex); e.target.textContent = T().pub_copied; setTimeout(() => e.target.textContent = T().pub_copy, 1500); });
    body.append(tr); body.append(ab);
  });
  $("#pubCount").textContent = `${rows.length} ${T().pubdb_count}`;
  $("#researchNote").textContent = lang === "ar" ? RESEARCH_NOTE_AR : RESEARCH_NOTE;
}
$("#pubSearch").addEventListener("input", e => { pubFilter.q = e.target.value.toLowerCase().trim(); renderPubs(); });
$("#pubYear").addEventListener("change", e => { pubFilter.year = e.target.value; renderPubs(); });
$("#pubType").addEventListener("change", e => { pubFilter.type = e.target.value; renderPubs(); });
$("#pubStatus").addEventListener("change", e => { pubFilter.status = e.target.value; renderPubs(); });
$$("#pubdb th[data-sort]").forEach(th => th.addEventListener("click", () => { const k = th.dataset.sort; if (pubFilter.sort === k) pubFilter.dir *= -1; else { pubFilter.sort = k; pubFilter.dir = k === "year" ? -1 : 1; } renderPubs(); }));

/* ════════════ INTERESTS GALLERY (page #gallery) ════════════ */
function galleryCtx() {
  renderGallery({ pick, t: T, lang, reduced, lightbox: (items, idx) => openLightbox(items, idx) });
}

/* ════════════ BLOG (markdown posts) ════════════ */
let POSTS = null;
async function loadPosts() {
  if (POSTS) return POSTS;
  try { POSTS = await (await fetch("posts/posts.json")).json(); }
  catch { POSTS = []; }
  POSTS.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return POSTS;
}
async function renderArticles() {
  const grid = $("#articlesGrid"), read = $("#articleRead");
  read.style.display = "none"; read.innerHTML = ""; grid.style.display = "";
  grid.innerHTML = "";
  const posts = await loadPosts();
  if (!posts.length) { grid.innerHTML = `<div class="articles-empty">${T().art_empty}</div>`; return; }
  posts.forEach(a => {
    const card = el("article", "article-card");
    card.innerHTML = `${a.cover ? `<img class="article-cover" src="${a.cover}" alt="" loading="lazy">` : ""}
      <div class="article-body" ${a.lang === "ar" ? 'dir="rtl"' : ""}>
        <div class="article-meta"><span>${a.date}</span><span class="dot"></span><span>${a.read} ${T().art_min}</span></div>
        <h3>${pick(a, "title")}</h3><p>${pick(a, "excerpt") || ""}</p>
        <div class="article-tags">${(a.tags || []).map(t => `<span>${t}</span>`).join("")}</div>
      </div>`;
    card.addEventListener("click", () => openArticle(a));
    grid.append(card);
  });
  window.__cursorBind?.();
}
async function openArticle(a) {
  const grid = $("#articlesGrid"), read = $("#articleRead");
  grid.style.display = "none"; read.style.display = "";
  let body = "";
  try {
    const md = await (await fetch(`posts/${a.file}`)).text();
    body = DOMPurify.sanitize(marked.parse(md));
  } catch { body = `<p>${T().art_empty}</p>`; }
  read.innerHTML = `<div class="article-full" ${a.lang === "ar" ? 'dir="rtl"' : ""}><span class="a-back">${T().art_back}</span>
    <h1>${pick(a, "title")}</h1><div class="a-meta">${a.date} · ${a.read} ${T().art_min}</div>
    ${a.cover ? `<img class="article-cover" style="border-radius:14px;margin-bottom:2rem" src="${a.cover}" alt="">` : ""}
    <div class="a-content">${body}</div></div>`;
  read.querySelector(".a-back").addEventListener("click", () => { renderArticles(); lenis?.scrollTo(0, { immediate: true }); scrollTo(0, 0); });
  lenis?.scrollTo(0, { immediate: true }); scrollTo(0, 0);
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
function applyLang() {
  applyStatic(); renderDynamic();
  const active = $(".page.active")?.id.replace("page-", "");
  if (active === "articles") renderArticles();
  if (active === "gallery") galleryCtx();
  if (active === "projects") wireFlow();
  if (active === "home") wireJourneyPath();
  requestAnimationFrame(() => ST.refresh());
}
$("#langToggle").addEventListener("click", () => { lang = lang === "en" ? "ar" : "en"; applyLang(); });

$("#cEmail").href = "mailto:" + PROFILE.email; $("#cEmail").textContent = PROFILE.email;
$("#cGithub").href = PROFILE.links.github; $("#cLinkedin").href = PROFILE.links.linkedin; $("#cScholar").href = PROFILE.links.scholar;

applyLang();

/* ════════════ MOTION ════════════ */
addEventListener("load", () => {
  const tl = gsap.timeline();
  tl.to("#loader", { yPercent: -100, duration: reduced ? 0 : 0.9, ease: "power4.inOut", delay: reduced ? 0 : 0.4 }).set("#loader", { display: "none" })
    .from(".hero-art img", { scale: 1.06, duration: 1.6, ease: "power2.out" }, "<")
    .from(".hero-kicker", { y: 18, opacity: 0 }, "<0.1")
    .from(".hero-title .line", { yPercent: 115, stagger: 0.1, duration: 1.1 }, "<0.05")
    .from(".hero-sub", { y: 18, opacity: 0 }, "<0.4")
    .from(".hero-cta-row", { y: 18, opacity: 0 }, "<0.15")
    .from(".navbar", { y: -24, opacity: 0 }, "<");
});
$$(".reveal").forEach(e => gsap.from(e, { y: reduced ? 0 : 40, opacity: 0, duration: 1.0, scrollTrigger: { trigger: e, start: "top 88%" } }));

// hero video: self-removes until vid/hero.mp4 ships (the still stays underneath)
const heroVid = $(".hero-vid");
if (heroVid) {
  if (reduced) heroVid.remove();
  else heroVid.addEventListener("error", () => heroVid.remove(), { once: true });
}
if (!reduced) gsap.to(".hero-art img, .hero-vid", { yPercent: 10, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 0.4 } });

/* ── journey glowing path (scroll-scrubbed, re-wireable per page show) ── */
function wireJourneyPath() {
  const path = $("#tlPath"); if (!path) return;
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  if (reduced) { path.style.strokeDashoffset = 0; return; }
  path.style.strokeDashoffset = len;
  journeyST?.kill();
  journeyST = ST.create({
    trigger: "#journey-sec", start: "top 75%", end: "bottom 65%", scrub: true,
    onUpdate: s => { path.style.strokeDashoffset = len * (1 - s.progress); },
    onRefresh: s => { path.style.strokeDashoffset = len * (1 - s.progress); },
  });
}
wireJourneyPath();

/* ── hardware flow gallery: rows drift as #galleries scrolls by ── */
function wireFlow() {
  flowSTs.forEach(s => s.kill()); flowSTs = [];
  if (reduced) return;
  const dir = document.documentElement.dir === "rtl" ? -1 : 1;
  [["#flowRobots", -1], ["#flowPrints", 1]].forEach(([sel, sign]) => {
    const row = $(sel); if (!row) return;
    const drift = () => Math.max(0, row.scrollWidth - row.parentElement.clientWidth + 80);
    flowSTs.push(gsap.fromTo(row, { x: sign * dir < 0 ? 0 : -drift() }, {
      x: sign * dir < 0 ? -drift() : 0, ease: "none",
      scrollTrigger: { trigger: "#galleries", start: "top 85%", end: "bottom 15%", scrub: 0.6, invalidateOnRefresh: true },
    }).scrollTrigger);
  });
}

/* ── project panel + lightbox ── */
const panel = $("#projPanel");
function openProject(p) { $("#ppImg").src = IMG(p.id, "w1600"); $("#ppImg").alt = pick(p, "title"); $("#ppKind").textContent = pick(p, "kind") + " · " + p.year; $("#ppTitle").textContent = pick(p, "title"); $("#ppBlurb").textContent = pick(p, "blurb"); panel.classList.add("active"); document.body.style.overflow = "hidden"; lenis?.stop(); }
function closePanel() { panel.classList.remove("active"); document.body.style.overflow = ""; lenis?.start(); }
$("#ppClose").addEventListener("click", closePanel); panel.addEventListener("click", e => { if (e.target === panel) closePanel(); });

let lbItems = [], lbIdx = 0; const lb = $("#lightbox");
function openLightbox(items, idx) { lbItems = items; lbIdx = idx; renderLb(); lb.classList.add("active"); document.body.style.overflow = "hidden"; lenis?.stop(); }
function renderLb() { const it = lbItems[lbIdx]; $("#lbImg").src = IMG(it.id, "w1600"); $("#lbImg").alt = pick(it, "cap") || pick(it, "name") || ""; $("#lbCap").textContent = pick(it, "cap") || pick(it, "name") || ""; $("#lbCount").textContent = `${lbIdx + 1} / ${lbItems.length}`; }
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
if (["#research", "#projects", "#gallery", "#articles", "#beyond"].includes(location.hash)) showPage(location.hash.slice(1));
