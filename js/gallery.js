/* Interactive interests gallery (page #gallery) — v9, 5 ways.
   Stage A: the generated emblem alone → click → five category cards burst out.
   Stage B: each category is a small "world":
     caddesign — rotating ring of my machines → click → 4-step design story
     hardware  — my real STLs, each rendered as a spotlit trophy, stepped through
     model     — a live damped 2nd-order system + the theory behind the machines
     sim        — a live GPS-denied estimate + my ROS 2 sim & Rviz 2 stack
     robotics   — a stylized 3D model per platform, with a 3D ⇄ real-photo toggle */

import * as THREE from "three";
import { STLLoader } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/STLLoader.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";
import { GALLERY, REPOS, ORGS, IMG } from "./data.js?v=12";

const qs = s => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

let ctx = null;                 // { pick, t, lang, reduced, lightbox }
let stage = "hub";              // hub | burst | world
let activeCat = null;
let live = [];                  // running scenes/loops to dispose on view change
const kill = () => { live.forEach(l => { try { l.stop(); } catch {} }); live = []; };
const onWin = (ev, fn) => { addEventListener(ev, fn); live.push({ stop: () => removeEventListener(ev, fn) }); };
const iconFor = c => `img/gal/${c.icon}.webp`;

export function renderGallery(context) { ctx = context; paint(); }

/* ══════════ stage machine ══════════ */
function paint() {
  kill();
  const hub = qs("#hubStage"), world = qs("#gpWorld");
  if (stage === "world" && activeCat) {
    hub.style.display = "none"; world.hidden = false;
    paintChips(); paintView(activeCat);
  } else {
    hub.style.display = ""; world.hidden = true;
    paintHub();
  }
}

function paintHub() {
  const wrap = qs("#hubCats"); wrap.innerHTML = "";
  const emblem = qs("#hubEmblem"), sub = qs("#hubSub");
  const stageEl = qs("#hubStage");
  stageEl.classList.toggle("burst", stage === "burst");
  sub.style.display = stage === "burst" ? "none" : "";

  const narrow = innerWidth < 760;
  const n = GALLERY.cats.length;
  const R = narrow ? 0 : Math.min(innerWidth * 0.30, 340);
  GALLERY.cats.forEach((c, i) => {
    const card = el("button", "cat-card", `<img class="cc-icon" src="${iconFor(c)}" alt="" loading="lazy"><b>${ctx.pick(c, "label")}</b><span class="cc-tease">${ctx.pick(c, "tease")}</span>`);
    if (!narrow) {
      const a = (-90 + i * (360 / n)) * Math.PI / 180;
      card.style.setProperty("--tx", `${Math.cos(a) * R * 1.3}px`);
      card.style.setProperty("--ty", `${Math.sin(a) * R * 0.8}px`);
    }
    card.addEventListener("click", () => { activeCat = c.id; stage = "world"; paint(); scrollTo({ top: 0, behavior: "instant" }); });
    wrap.append(card);
  });

  if (!emblem.__wired) {
    emblem.__wired = true;
    if (!ctx.reduced) {
      const v = document.createElement("video");
      v.className = "hub-vid"; v.src = "vid/emblem.mp4";
      v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
      v.setAttribute("aria-hidden", "true");
      v.addEventListener("error", () => v.remove(), { once: true });
      emblem.insertBefore(v, emblem.querySelector(".hub-pulse"));
    }
    emblem.addEventListener("click", () => {
      if (stage !== "hub") return;
      stage = "burst";
      paintHub();
      if (window.gsap && !ctx.reduced) {
        gsap.fromTo("#hubCats .cat-card", { x: 0, y: 0, scale: 0.3, opacity: 0 },
          { x: (i, t) => t.style.getPropertyValue("--tx") || 0, y: (i, t) => t.style.getPropertyValue("--ty") || 0,
            scale: 1, opacity: 1, duration: 0.9, stagger: 0.06, ease: "expo.out" });
        gsap.to("#hubEmblem", { scale: innerWidth < 760 ? 0.9 : 0.64, duration: 0.9, ease: "expo.out" });
      }
    });
  }
  if (stage === "burst") {
    if (!(window.gsap && !ctx.reduced)) qs("#hubEmblem").style.transform = innerWidth < 760 ? "scale(.9)" : "scale(.64)";
  } else {
    qs("#hubEmblem").style.transform = "";
    if (window.gsap) gsap.set("#hubEmblem", { clearProps: "all" });
  }
  window.__cursorBind?.();
}

function paintChips() {
  const bar = qs("#gpChips"); bar.innerHTML = "";
  GALLERY.cats.forEach(c => {
    const b = el("button", "gp-chip" + (c.id === activeCat ? " on" : ""), `<img class="gp-chip-i" src="${iconFor(c)}" alt="">${ctx.pick(c, "label")}`);
    b.addEventListener("click", () => { activeCat = c.id; paint(); });
    bar.append(b);
  });
  const back = qs("#gpBack");
  back.textContent = ctx.t().hub_back;
  if (!back.__wired) { back.__wired = true; back.addEventListener("click", () => { stage = "burst"; paint(); }); }
}

function paintView(id) {
  const host = qs("#gpView"); host.innerHTML = "";
  const cat = GALLERY.cats.find(c => c.id === id);
  host.append(el("div", "gp-view-head", `<h2>${ctx.pick(cat, "label")}</h2>`));
  ({ design: viewDesign, mathmodel: viewMath, physsim: viewSim, fabrication: viewFab, software: viewSoftware, integration: viewIntegration })[id](host);
  window.__cursorBind?.();
}
const skillChips = (host, skills, label) => {
  if (!skills?.length) return;
  const w = el("div", "gp-skillrow", `<span class="gp-skilllabel">${label}</span>`);
  const chips = el("div", "gp-toolchips");
  skills.forEach(s => chips.append(el("span", "chip", s)));
  w.append(chips); host.append(w);
};

/* ══════════ 3D ring carousel (CAD & Design) ══════════ */
function buildRing(host, items, makeFace, onPick) {
  const stageEl = el("div", "ring-stage");
  const ring = el("div", "ring3d");
  const n = items.length, cardW = Math.min(330, Math.max(190, innerWidth * 0.42));
  const R = Math.round((cardW / 2) / Math.tan(Math.PI / n)) + 70;
  items.forEach((it, i) => {
    const slot = el("div", "ring-slot");
    slot.style.transform = `rotateY(${(360 / n) * i}deg) translateZ(${R}px)`;
    const c = el("div", "ring-card");
    c.style.width = cardW + "px";
    c.innerHTML = makeFace(it);
    c.addEventListener("click", () => { if (Math.abs(moved) < 8) onPick(it, i); });
    slot.append(c); ring.append(slot);
  });
  const cardH = cardW * 0.75 + 52;
  const persp = 1600, scale = persp / (persp - R);
  stageEl.style.height = Math.round(cardH * scale) + 40 + "px";
  ring.style.transform = `translateZ(${-R}px)`;
  stageEl.append(ring); host.append(stageEl);

  let rot = 0, vel = ctx.reduced ? 0 : 0.12, dragging = false, px = 0, moved = 0, hover = false;
  stageEl.addEventListener("pointerenter", () => hover = true);
  stageEl.addEventListener("pointerleave", () => { hover = false; dragging = false; });
  stageEl.addEventListener("pointerdown", e => { dragging = true; px = e.clientX; moved = 0; });
  onWin("pointermove", e => { if (!dragging) return; const dx = e.clientX - px; px = e.clientX; moved += Math.abs(dx); rot += dx * 0.35; vel = dx * 0.12; });
  onWin("pointerup", () => dragging = false);

  let raf, alive = true;
  (function loop() {
    if (!alive) return;
    if (!dragging) { rot += hover ? vel * 0.2 : (vel = ctx.reduced ? 0 : Math.sign(vel || 1) * 0.12, vel); }
    ring.style.transform = `translateZ(${-R}px) rotateY(${rot}deg)`;
    raf = requestAnimationFrame(loop);
  })();
  live.push({ stop: () => { alive = false; cancelAnimationFrame(raf); } });
}

/* ── Design world: sketches → CAD → drawings, each machine's design story ── */
function viewDesign(host) {
  host.append(el("p", "gp-hint", ctx.t().design_hint));
  const items = GALLERY.design.projects;
  const brief = el("div", "design-brief");
  buildRing(host, items, it =>
    `<img src="${IMG(it.id, "w480")}" alt="${ctx.pick(it, "name")}" loading="lazy"><figcaption>${ctx.pick(it, "name")}</figcaption>`,
    it => {
      brief.innerHTML = `<div class="db-head"><img src="${IMG(it.id, "w960")}" alt=""><h3>${ctx.pick(it, "name")}</h3></div>
        <div class="db-steps">` + it.steps.map((s, i) =>
          `<div class="db-step"><span class="db-n">${i + 1}</span><b>${ctx.pick(s, "t")}</b><p>${ctx.pick(s, "d")}</p></div>`).join("") + `</div>`;
      brief.classList.add("on");
      if (window.gsap && !ctx.reduced) gsap.from(brief.querySelectorAll(".db-step"), { y: 18, opacity: 0, stagger: 0.07, duration: 0.5, ease: "expo.out" });
      brief.scrollIntoView({ behavior: ctx.reduced ? "instant" : "smooth", block: "nearest" });
    });
  skillChips(host, GALLERY.design.skills, ctx.t().gp_skills);
  host.append(brief);
}

/* ── Software world: skills + orgs + the repos behind the robots ── */
function viewSoftware(host) {
  const T = ctx.t();
  host.append(el("p", "gp-hint center", ctx.pick(GALLERY.software, "intro")));
  skillChips(host, GALLERY.software.skills, T.gp_skills);
  host.append(el("h3", "gp-subh", T.soft_orgs));
  const og = el("div", "org-grid");
  ORGS.forEach(o => og.append(el("article", "card org",
    `<div class="org-top"><span class="org-name">${o.name}</span><span class="org-handle">@${o.handle}</span></div>
     <p class="org-role">${ctx.pick(o, "role")}</p><p class="org-desc">${ctx.pick(o, "desc")}</p>
     <div class="org-links"><a href="${o.url}" target="_blank" rel="noopener">${T.org_follow}</a>${o.site ? `<a href="${o.site}" target="_blank" rel="noopener">${T.org_site}</a>` : ""}</div>`)));
  host.append(og);
  host.append(el("h3", "gp-subh", T.soft_repos));
  const rg = el("div", "repo-grid soft-repos");
  REPOS.forEach(r => {
    const a = el("a", "card repo");
    a.href = r.url; a.target = "_blank"; a.rel = "noopener";
    a.innerHTML = `<div class="repo-top"><span class="repo-name">${r.name}</span><span class="repo-star">★ ${r.stars}</span></div><p>${ctx.pick(r, "desc")}</p><span class="repo-lang">${r.lang}</span>`;
    rg.append(a);
  });
  host.append(rg);
  host.append(el("p", "gp-hint center", `<a class="soft-gh" href="https://github.com/asmbatati" target="_blank" rel="noopener">${T.soft_gh}</a>`));
}

/* ══════════ Three.js helpers ══════════ */
function makeScene(host, h = 460, opts = {}) {
  const holder = el("div", "three-stage" + (opts.dark ? " dark" : "")); holder.style.height = h + "px";
  host.append(holder);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !opts.dark }); }
  catch { holder.replaceWith(el("p", "gp-hint", "WebGL unavailable — 3D view skipped.")); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  holder.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  if (opts.dark) {
    scene.background = new THREE.Color(0x0d1013);
    scene.add(new THREE.AmbientLight(0x607686, 0.5));
    const key = new THREE.DirectionalLight(0xfff2d8, 2.4); key.position.set(1.4, 4, 2.6); scene.add(key);
    const spot = new THREE.SpotLight(0xfff0d0, 90, 16, Math.PI / 7, 0.5, 1.1); spot.position.set(0.5, 6, 2.4);
    spot.target.position.set(0, -0.2, 0); scene.add(spot); scene.add(spot.target);
    const rim = new THREE.DirectionalLight(0x3f7a86, 0.7); rim.position.set(-3, 0.6, -2.4); scene.add(rim);
  } else {
    scene.add(new THREE.HemisphereLight(0xfff8ec, 0x24352c, 1.05));
    const d1 = new THREE.DirectionalLight(0xffffff, 1.35); d1.position.set(2.5, 3.5, 2.5); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xd8e2d5, 0.45); d2.position.set(-2.5, 1.2, -2.5); scene.add(d2);
  }
  const root = new THREE.Group(); scene.add(root);
  const size = () => {
    const w = holder.clientWidth, hh = holder.clientHeight;
    if (!w || !hh) return;
    renderer.setSize(w, hh); camera.aspect = w / hh; camera.updateProjectionMatrix();
  };
  size();
  const ro = new ResizeObserver(size); ro.observe(holder);
  let raf, alive = true;
  const start = tick => (function loop(t) { if (!alive) return; tick(t / 1000); renderer.render(scene, camera); raf = requestAnimationFrame(loop); })(0);
  live.push({ stop: () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); } });
  return { scene, camera, renderer, root, start, holder };
}
const MAT = () => ({
  body: new THREE.MeshStandardMaterial({ color: 0x21503d, roughness: 0.55, metalness: 0.15 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x16352a, roughness: 0.7 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xf2ece1, roughness: 0.85 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xb6803a, roughness: 0.4, metalness: 0.45 }),
  tire: new THREE.MeshStandardMaterial({ color: 0x1d201e, roughness: 0.95 }),
});
const mesh = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o;
};
function props2(r, m, y = 0) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(r * 2, 0.012, 0.05), m, 0, y, 0));
  g.add(mesh(new THREE.BoxGeometry(0.05, 0.012, r * 2), m, 0, y, 0));
  return g;
}

/* ── platform builders (stylized, procedural) ── */
function buildQuad(M) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.14, 0.5), M.body, 0, 0.02, 0));
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), M.cream, 0, 0.12, 0));
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2, L = 0.62;
    g.add(mesh(new THREE.BoxGeometry(L, 0.045, 0.07), M.dark, Math.cos(a) * L / 2, 0.02, Math.sin(a) * L / 2, 0, -a, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.09, 16), M.gold, Math.cos(a) * L, 0.08, Math.sin(a) * L));
    const p = props2(0.3, M.dark, 0); p.position.set(Math.cos(a) * L, 0.14, Math.sin(a) * L); p.userData.spin = 1; g.add(p);
  }
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.12, 0.14), M.dark, 0, -0.1, 0.16));
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 14), M.gold, 0, -0.1, 0.25, Math.PI / 2, 0, 0));
  [-0.16, 0.16].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.04, 0.16, 0.5), M.cream, x, -0.15, 0)));
  return g;
}
function buildHexa(M) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.16, 6), M.body, 0, 0.02, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 6), M.cream, 0, 0.13, 0));
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, L = 0.72;
    g.add(mesh(new THREE.BoxGeometry(L, 0.04, 0.06), M.dark, Math.cos(a) * L / 2, 0.02, Math.sin(a) * L / 2, 0, -a, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.08, 14), M.gold, Math.cos(a) * L, 0.07, Math.sin(a) * L));
    const p = props2(0.26, M.dark); p.position.set(Math.cos(a) * L, 0.13, Math.sin(a) * L); p.userData.spin = 1; g.add(p);
  }
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.3, 18), M.cream, 0, -0.2, 0));
  g.add(mesh(new THREE.SphereGeometry(0.09, 18, 14), M.dark, 0, -0.42, 0));
  return g;
}
function buildVTOL(M) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CapsuleGeometry(0.13, 1.05, 8, 16), M.cream, 0, 0, 0, 0, 0, Math.PI / 2));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.03, 2.3), M.body, 0.05, 0.1, 0));
  [-0.62, 0.62].forEach(z => {
    g.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.25, 10), M.dark, 0, 0.06, z, 0, 0, Math.PI / 2));
    [-0.55, 0.55].forEach(x => {
      g.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.07, 12), M.gold, x, 0.12, z));
      const p = props2(0.22, M.dark); p.position.set(x, 0.17, z); p.userData.spin = 1; g.add(p);
    });
  });
  g.add(mesh(new THREE.BoxGeometry(0.03, 0.02, 1.3), M.body, -0.62, 0.06, 0));
  g.add(mesh(new THREE.BoxGeometry(0.26, 0.02, 1.28), M.body, -0.72, 0.14, 0));
  [-0.62, 0.62].forEach(z => g.add(mesh(new THREE.BoxGeometry(0.24, 0.2, 0.02), M.body, -0.72, 0.06, z)));
  const pusher = props2(0.2, M.dark); pusher.rotation.z = Math.PI / 2; pusher.position.set(-0.72, 0, 0); pusher.userData.spin = 1; g.add(pusher);
  g.add(mesh(new THREE.SphereGeometry(0.05, 14, 12), M.dark, 0.66, -0.05, 0));
  return g;
}
function buildRover(M) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.05, 0.16, 0.55), M.body, 0, 0.06, 0));
  g.add(mesh(new THREE.BoxGeometry(0.85, 0.06, 0.45), M.cream, 0, 0.18, 0));
  [[-0.38, 0.33], [0.38, 0.33], [-0.38, -0.33], [0.38, -0.33]].forEach(([x, z]) => {
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.13, 20), M.tire, x, -0.08, z, Math.PI / 2, 0, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 12), M.gold, x, -0.08, z, Math.PI / 2, 0, 0));
    g.add(mesh(new THREE.BoxGeometry(0.2, 0.05, 0.06), M.dark, x * 0.72, 0.02, z * 0.85, 0, 0, x > 0 ? -0.5 : 0.5));
  });
  g.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 10), M.dark, -0.2, 0.42, 0));
  const cam = mesh(new THREE.BoxGeometry(0.24, 0.09, 0.09), M.dark, -0.2, 0.65, 0);
  [-0.07, 0.07].forEach(z => cam.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 12), M.gold, 0.1, 0, z, 0, 0, Math.PI / 2)));
  g.add(cam);
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), M.gold, 0.35, 0.4, -0.15));
  return g;
}
function buildAGV(M) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.0, 0.2, 0.68), M.body, 0, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(0.84, 0.05, 0.55), M.cream, 0, 0.16, 0));
  const led = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.03, 0.7), new THREE.MeshStandardMaterial({ color: 0xb6803a, emissive: 0xb6803a, emissiveIntensity: 0.7 }));
  led.position.y = -0.06; g.add(led);
  [[-0.32, 0.24], [0.32, 0.24], [-0.32, -0.24], [0.32, -0.24]].forEach(([x, z]) =>
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14), M.tire, x, -0.12, z, Math.PI / 2, 0, 0)));
  g.add(mesh(new THREE.BoxGeometry(0.08, 0.06, 0.3), M.dark, 0.47, 0.04, 0));
  g.add(mesh(new THREE.BoxGeometry(0.55, 0.04, 0.4), M.gold, 0, 0.24, 0));
  return g;
}
function buildBot(M) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.12, 26), M.dark, 0, -0.55, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.95, 26), M.cream, 0, 0, 0));
  g.add(mesh(new THREE.SphereGeometry(0.2, 26, 18, 0, Math.PI * 2, 0, Math.PI / 2), M.cream, 0, 0.48, 0));
  g.add(mesh(new THREE.BoxGeometry(0.24, 0.17, 0.02), M.dark, 0, 0.32, 0.23, -0.25, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.03, 0.42), M.body, 0, -0.28, -0.38));
  [[-0.22, -0.56], [0.22, -0.56]].forEach(([x, z]) => g.add(mesh(new THREE.BoxGeometry(0.03, 0.22, 0.03), M.gold, x, -0.18, z)));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.02, 0.03), M.gold, 0, -0.06, -0.56));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16), M.gold, 0, 0.6, 0));
  return g;
}
function buildGo2(M) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.72, 0.2, 0.28), M.body, 0, 0.22, 0));
  g.add(mesh(new THREE.BoxGeometry(0.56, 0.05, 0.24), M.cream, 0, 0.35, 0));
  const head = mesh(new THREE.BoxGeometry(0.14, 0.12, 0.18), M.dark, 0.42, 0.24, 0);
  head.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12), M.gold, 0.08, 0, 0, 0, 0, Math.PI / 2));
  g.add(head);
  const limb = (len, w, mat) => { const p = new THREE.Group(); p.add(mesh(new THREE.BoxGeometry(w, len, w * 0.9), mat, 0, -len / 2, 0)); return p; };
  [[0.26, 0.17], [0.26, -0.17], [-0.26, 0.17], [-0.26, -0.17]].forEach(([x, z], i) => {
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 12), M.gold, x, 0.2, z + Math.sign(z) * 0.02, Math.PI / 2, 0, 0));
    const thigh = limb(0.24, 0.06, M.body);
    thigh.position.set(x, 0.2, z);
    thigh.rotation.z = 0.55;
    thigh.userData.leg = i * Math.PI / 2; thigh.userData.baseZ = 0.55;
    const calf = limb(0.24, 0.045, M.dark);
    calf.position.y = -0.24; calf.rotation.z = -1.1;
    calf.add(mesh(new THREE.SphereGeometry(0.032, 10, 8), M.tire, 0, -0.24, 0));
    thigh.add(calf);
    g.add(thigh);
  });
  g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8), M.gold, -0.38, 0.4, 0, 0, 0, 0.5));
  return g;
}
const BUILDERS = { quad: buildQuad, hexa: buildHexa, vtol: buildVTOL, go2: buildGo2, rover: buildRover, agv: buildAGV, bot: buildBot };

/* ── Robotic Systems Integration: 3D model per platform, 3D ⇄ photo toggle ── */
function viewIntegration(host) {
  const T = ctx.t();
  host.append(el("p", "gp-hint center", ctx.pick(GALLERY.integration, "intro")));
  const grid = el("div", "gp-robotics"); host.append(grid);
  const stageCol = el("div", "gpr-stage");
  const side = el("div", "gpr-side", `<div class="d-h">${T.gp_pick}</div>`);
  grid.append(stageCol, side);

  // the photo overlays ONLY this wrapper (canvas area) — the caption + toggle
  // below stay clickable, so you can always switch back to the 3D model
  const viewWrap = el("div", "gpr-view3d"); stageCol.append(viewWrap);
  const sc = makeScene(viewWrap, Math.min(460, innerWidth * 0.9));
  const photoBox = el("div", "gpr-photo"); photoBox.hidden = true; viewWrap.append(photoBox);
  const caption = el("div", "gpr-caption"); stageCol.append(caption);
  stageCol.append(el("p", "gp-hint center", T.gp_drag));
  if (!sc) return;
  sc.camera.position.set(0, 0.9, 3.1); sc.camera.lookAt(0, 0, 0);
  const M = MAT();
  let current = null, rotY = 0, vel = 0, dragging = false, px = 0, mode = "3d", selected = null;

  const list = el("div", "gpr-list"); side.append(list);
  function applyMode(p) {
    const hasPhoto = !!p.photo;
    viewWrap.classList.toggle("show-photo", mode === "photo" && hasPhoto);
    photoBox.hidden = !(mode === "photo" && hasPhoto);
    if (mode === "photo" && hasPhoto) photoBox.innerHTML = `<img src="${IMG(p.photo, "w960")}" alt="${ctx.pick(p, "name")}">`;
  }
  function select(p) {
    selected = p;
    if (current) sc.root.remove(current);
    current = BUILDERS[p.id](M);
    current.position.y = -0.05;
    sc.root.add(current);
    if (window.gsap && !ctx.reduced) { current.scale.setScalar(0.001); gsap.to(current.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "expo.out" }); }
    const toggle = p.photo
      ? `<div class="gpr-toggle"><button data-m="3d" class="${mode === "3d" ? "on" : ""}">${T.gp_3d}</button><button data-m="photo" class="${mode === "photo" ? "on" : ""}">${T.gp_photo}</button></div>`
      : "";
    caption.innerHTML = `<div class="gpr-cap-top"><h3>${ctx.pick(p, "name")}</h3>${toggle}</div>
      <p>${ctx.pick(p, "desc")}</p><div class="gp-toolchips">${p.tags.map(t => `<span class="chip">${t}</span>`).join("")}</div>`;
    caption.querySelectorAll(".gpr-toggle button").forEach(b => b.addEventListener("click", () => {
      mode = b.dataset.m;
      caption.querySelectorAll(".gpr-toggle button").forEach(x => x.classList.toggle("on", x === b));
      applyMode(p);
    }));
    applyMode(p);
    list.querySelectorAll(".gpr-item").forEach(b => b.classList.toggle("on", b.dataset.id === p.id));
  }
  GALLERY.integration.platforms.forEach(p => {
    const b = el("button", "gpr-item", `<b>${ctx.pick(p, "name")}</b><span>${ctx.pick(p, "desc").split("—")[0].split(".")[0]}</span>`);
    b.dataset.id = p.id;
    b.addEventListener("click", () => select(p));
    list.append(b);
  });
  const cv = sc.renderer.domElement;
  cv.style.touchAction = "pan-y";
  cv.addEventListener("pointerdown", e => { dragging = true; px = e.clientX; });
  onWin("pointermove", e => { if (!dragging) return; const dx = e.clientX - px; px = e.clientX; vel = dx * 0.006; rotY += dx * 0.012; });
  onWin("pointerup", () => dragging = false);
  select(GALLERY.integration.platforms[0]);
  sc.start(t => {
    if (!dragging) { rotY += ctx.reduced ? 0 : 0.006 + vel; vel *= 0.94; }
    if (current) {
      current.rotation.y = rotY;
      current.position.y = -0.05 + (ctx.reduced ? 0 : Math.sin(t * 1.4) * 0.03);
      current.traverse(o => {
        if (o.userData.spin) o.rotation.y = t * (ctx.reduced ? 0 : 14);
        if (o.userData.leg != null && !ctx.reduced) o.rotation.z = o.userData.baseZ + Math.sin(t * 2.6 + o.userData.leg) * 0.1;
      });
    }
  });
}

/* ── Fabrication & Integration: real STLs as spotlit trophies ── */
function viewFab(host) {
  const T = ctx.t();
  host.append(el("p", "gp-hint center", ctx.pick(GALLERY.fabrication, "intro")));
  const sc = makeScene(host, Math.min(520, innerWidth * 0.92), { dark: true });
  const cap = el("div", "trophy-cap"); host.append(cap);
  const nav = el("div", "trophy-nav",
    `<button class="trophy-btn trophy-prev" aria-label="Previous">‹</button><span class="gp-hint">${T.gp_trophy_hint}</span><button class="trophy-btn trophy-next" aria-label="Next">›</button>`);
  host.append(nav);
  if (sc) {
    sc.camera.position.set(0, 1.0, 3.9); sc.camera.lookAt(0, 0.1, 0);
    // pedestal + gold ring
    sc.root.add(mesh(new THREE.CylinderGeometry(0.95, 1.12, 0.34, 56), new THREE.MeshStandardMaterial({ color: 0x161a1f, roughness: 0.85 }), 0, -1.05, 0));
    sc.root.add(mesh(new THREE.CylinderGeometry(0.97, 0.97, 0.02, 56), new THREE.MeshStandardMaterial({ color: 0xb6803a, roughness: 0.4, metalness: 0.5 }), 0, -0.87, 0));
    const stlLoader = new STLLoader(), gltfLoader = new GLTFLoader();
    const trophies = GALLERY.fabrication.trophies;
    let current = null, idx = 0, rot = 0, vel = 0, dragging = false, px = 0, token = 0;
    const mat = new THREE.MeshStandardMaterial({ color: 0x4f9b74, roughness: 0.42, metalness: 0.12 });
    // scale + centre an object into the trophy pose, then swap it in
    const place = obj => {
      const box = new THREE.Box3().setFromObject(obj), c = new THREE.Vector3(), size = new THREE.Vector3();
      box.getCenter(c); box.getSize(size);
      obj.position.sub(c);
      const maxd = Math.max(size.x, size.y, size.z) || 1;
      const g = new THREE.Group(); g.add(obj); g.scale.setScalar(1.6 / maxd); g.position.y = 0.15;
      if (current) sc.root.remove(current);
      current = g; sc.root.add(g);
      if (window.gsap && !ctx.reduced) { const s = 1.6 / maxd; g.scale.setScalar(0.01); gsap.to(g.scale, { x: s, y: s, z: s, duration: 0.7, ease: "expo.out" }); }
    };
    function show(i) {
      idx = (i + trophies.length) % trophies.length;
      const tr = trophies[idx], my = ++token;
      cap.innerHTML = `<h3>${ctx.pick(tr, "name")}</h3><p>${ctx.pick(tr, "note")}</p><span class="trophy-count">${idx + 1} / ${trophies.length}</span>`;
      const fail = () => { if (my === token) cap.innerHTML += `<p class="gp-hint">(mesh failed to load)</p>`; };
      if (/\.glb$/i.test(tr.file)) {                 // textured GLB — keep its own materials, Y-up
        gltfLoader.load(`assets/models/${tr.file}`, gltf => { if (my !== token) return; place(gltf.scene); }, undefined, fail);
      } else {                                       // STL — solid material, Z-up → upright
        stlLoader.load(`assets/stl/${tr.file}`, geo => {
          if (my !== token) return;
          const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2;
          place(m);
        }, undefined, fail);
      }
    }
    nav.querySelector(".trophy-prev").addEventListener("click", () => show(idx - 1));
    nav.querySelector(".trophy-next").addEventListener("click", () => show(idx + 1));
    const cv = sc.renderer.domElement; cv.style.touchAction = "pan-y";
    cv.addEventListener("pointerdown", e => { dragging = true; px = e.clientX; });
    onWin("pointermove", e => { if (!dragging) return; const dx = e.clientX - px; px = e.clientX; vel = dx * 0.01; rot += dx * 0.01; });
    onWin("pointerup", () => dragging = false);
    onWin("keydown", e => { if (e.key === "ArrowLeft") show(idx - 1); if (e.key === "ArrowRight") show(idx + 1); });
    show(0);
    sc.start(t => {
      if (!dragging) { rot += ctx.reduced ? 0 : 0.01 + vel; vel *= 0.95; }
      if (current) { current.rotation.y = rot; current.position.y = 0.15 + (ctx.reduced ? 0 : Math.sin(t * 1.1) * 0.05); }
    });
  }
  // the real prints, below
  host.append(el("h3", "gp-subh", T.gp_prints_h));
  const strip = el("div", "print-strip");
  GALLERY.fabrication.photos.forEach((p, i) => {
    const f = el("figure", "gItem", `<img src="${IMG(p.id, "w480")}" alt="${ctx.pick(p, "cap")}" loading="lazy"><figcaption>${ctx.pick(p, "cap")}</figcaption>`);
    f.addEventListener("click", () => ctx.lightbox(GALLERY.fabrication.photos, i));
    strip.append(f);
  });
  host.append(strip);
}

/* ── Physics & Math world: live 2nd-order system + theory cards ── */
function viewMath(host) {
  const T = ctx.t();
  const wrap = el("div", "math-wrap",
    `<div class="math-eq">ẍ + 2ζω<sub>n</sub>ẋ + ω<sub>n</sub>²x = 0</div>
     <div class="math-grid"><canvas id="mSpring"></canvas><canvas id="mPlot"></canvas></div>
     <div class="math-controls">
       <label>${T.math_zeta} <input type="range" id="mZeta" min="0.02" max="1.2" step="0.01" value="0.12"><b id="mZetaV">0.12</b></label>
       <label>${T.math_wn} <input type="range" id="mWn" min="1" max="8" step="0.1" value="3"><b id="mWnV">3.0</b></label>
       <button class="btn-ghost-sm" id="mKick">⟳</button>
     </div>`);
  host.append(wrap);
  const cs = wrap.querySelector("#mSpring"), cp = wrap.querySelector("#mPlot");
  const xs = cs.getContext("2d"), xp = cp.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const fit = (c, w, h) => { c.width = w * dpr; c.height = h * dpr; c.style.width = w + "px"; c.style.height = h + "px"; c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0); };
  const W1 = Math.min(300, innerWidth * 0.42), W2 = Math.min(560, innerWidth * 0.9), H = 320;
  fit(cs, W1, H); fit(cp, W2, H);

  let zeta = 0.12, wn = 3, x = 1, v = 0;
  const trace = [];
  wrap.querySelector("#mZeta").addEventListener("input", e => { zeta = +e.target.value; wrap.querySelector("#mZetaV").textContent = zeta.toFixed(2); });
  wrap.querySelector("#mWn").addEventListener("input", e => { wn = +e.target.value; wrap.querySelector("#mWnV").textContent = wn.toFixed(1); });
  wrap.querySelector("#mKick").addEventListener("click", () => { x = 1; v = 0; trace.length = 0; });

  const ink = "#16352a", green = "#2f6b4f", gold = "#b6803a", dim = "#8a978c";
  let raf, alive = true, last = 0;
  (function loop(ts) {
    if (!alive) return;
    const dt = Math.min((ts - last) / 1000 || 0.016, 0.05); last = ts;
    for (let i = 0; i < 4; i++) { const h = dt / 4; v += (-2 * zeta * wn * v - wn * wn * x) * h; x += v * h; }
    trace.push(x); if (trace.length > 360) trace.shift();
    xs.clearRect(0, 0, W1, H);
    xs.strokeStyle = dim; xs.lineWidth = 1; xs.strokeRect(W1 / 2 - 40, 8, 80, 6);
    const y0 = 40, yM = 150 + x * 70;
    xs.beginPath(); xs.moveTo(W1 / 2, 14); xs.lineTo(W1 / 2, y0);
    const coils = 9;
    for (let i = 0; i <= coils; i++) { const t = i / coils; xs.lineTo(W1 / 2 + (i === 0 || i === coils ? 0 : (i % 2 ? 16 : -16)), y0 + (yM - 26 - y0) * t); }
    xs.lineTo(W1 / 2, yM - 20);
    xs.strokeStyle = green; xs.lineWidth = 2; xs.stroke();
    xs.fillStyle = ink; xs.fillRect(W1 / 2 - 26, yM - 20, 52, 40);
    xs.fillStyle = gold; xs.fillRect(W1 / 2 - 26, yM - 20, 52, 5);
    xs.fillStyle = dim; xs.font = "12px Inter"; xs.textAlign = "center"; xs.fillText("m", W1 / 2, yM + 6);
    xp.clearRect(0, 0, W2, H);
    xp.strokeStyle = "rgba(22,53,42,.12)"; xp.lineWidth = 1; xp.beginPath(); xp.moveTo(0, H / 2); xp.lineTo(W2, H / 2); xp.stroke();
    xp.strokeStyle = green; xp.lineWidth = 2; xp.beginPath();
    trace.forEach((tx, i) => { const px2 = (i / 360) * W2, py = H / 2 - tx * 90; i ? xp.lineTo(px2, py) : xp.moveTo(px2, py); });
    xp.stroke();
    const ix = W2 - 120, iy = 14, iw = 106, ih = 106;
    xp.strokeStyle = "rgba(22,53,42,.2)"; xp.strokeRect(ix, iy, iw, ih);
    xp.fillStyle = "rgba(242,236,225,.75)"; xp.fillRect(ix, iy, iw, ih);
    xp.strokeStyle = gold; xp.lineWidth = 1.4; xp.beginPath(); xp.arc(ix + iw / 2 + x * 34, iy + ih / 2 + v / wn * 34, 2.4, 0, Math.PI * 2); xp.stroke();
    xp.fillStyle = dim; xp.font = "10px Inter"; xp.textAlign = "left"; xp.fillText("x–ẋ", ix + 6, iy + 14);
    raf = requestAnimationFrame(loop);
  })(0);
  live.push({ stop: () => { alive = false; cancelAnimationFrame(raf); } });

  // theory cards
  host.append(el("h3", "gp-subh", T.gp_theory));
  const grid = el("div", "theory-grid");
  GALLERY.mathmodel.topics.forEach(tp => grid.append(el("article", "theory-card",
    `<div class="theory-eq">${tp.eq}</div><b>${ctx.pick(tp, "t")}</b><p>${ctx.pick(tp, "note")}</p>`)));
  host.append(grid);
}

/* ── Simulation world: live GPS-denied estimate + ROS 2 sim/viz stack ── */
function viewSim(host) {
  const T = ctx.t();
  host.append(el("p", "gp-hint center", ctx.pick(GALLERY.physsim, "intro")));
  const wrap = el("div", "sim-wrap", `<canvas id="simCv"></canvas>
    <div class="sim-legend"><span class="sl-truth">— truth</span><span class="sl-est">– – estimate</span><span class="sl-fix">◉ correction</span></div>`);
  host.append(wrap);
  const cv = wrap.querySelector("#simCv"), g = cv.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = Math.min(880, innerWidth * 0.92), H = Math.min(400, innerWidth * 0.6);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const wps = [[0.08, 0.75], [0.25, 0.4], [0.45, 0.62], [0.62, 0.28], [0.8, 0.5], [0.92, 0.25]].map(([x, y]) => [x * W, y * H]);
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const pos = t => { const seg = Math.min(Math.floor(t), wps.length - 2); return lerp(wps[seg], wps[seg + 1], t - seg); };
  let Tt = 0, drift = [0, 0], est = [], truth = [], fixes = [];
  let raf, alive = true;
  (function loop() {
    if (!alive) return;
    Tt += ctx.reduced ? 0 : 0.006 * (wps.length - 1) / 3;
    if (Tt >= wps.length - 1) { Tt = 0; drift = [0, 0]; est = []; truth = []; fixes = []; }
    const p = pos(Tt);
    drift[0] += (Math.random() - 0.5) * 1.6; drift[1] += (Math.random() - 0.5) * 1.6;
    const seg = Math.floor(Tt);
    if (Tt - seg < 0.012 && seg > 0 && !fixes.some(f => f.seg === seg)) { fixes.push({ seg, at: [...p] }); drift = [drift[0] * 0.15, drift[1] * 0.15]; }
    truth.push([...p]); est.push([p[0] + drift[0], p[1] + drift[1]]);
    if (truth.length > 900) { truth.shift(); est.shift(); }
    g.clearRect(0, 0, W, H);
    g.strokeStyle = "rgba(22,53,42,.08)"; g.lineWidth = 1;
    for (let x = 0; x <= W; x += 44) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y <= H; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = "rgba(22,53,42,.25)"; g.setLineDash([3, 7]); g.beginPath();
    wps.forEach((w, i) => i ? g.lineTo(w[0], w[1]) : g.moveTo(w[0], w[1])); g.stroke(); g.setLineDash([]);
    wps.forEach(w => { g.fillStyle = "#f2ece1"; g.strokeStyle = "#8a978c"; g.beginPath(); g.arc(w[0], w[1], 5, 0, Math.PI * 2); g.fill(); g.stroke(); });
    g.strokeStyle = "#2f6b4f"; g.lineWidth = 2.2; g.beginPath(); truth.forEach((w, i) => i ? g.lineTo(w[0], w[1]) : g.moveTo(w[0], w[1])); g.stroke();
    g.strokeStyle = "#b6803a"; g.lineWidth = 1.6; g.setLineDash([6, 5]); g.beginPath(); est.forEach((w, i) => i ? g.lineTo(w[0], w[1]) : g.moveTo(w[0], w[1])); g.stroke(); g.setLineDash([]);
    fixes.forEach(f => { g.strokeStyle = "#b6803a"; g.beginPath(); g.arc(f.at[0], f.at[1], 9, 0, Math.PI * 2); g.stroke(); });
    g.fillStyle = "#16352a"; g.beginPath(); g.arc(p[0], p[1], 6, 0, Math.PI * 2); g.fill();
    const e = est[est.length - 1];
    if (e) { g.fillStyle = "#b6803a"; g.beginPath(); g.arc(e[0], e[1], 4, 0, Math.PI * 2); g.fill(); }
    raf = requestAnimationFrame(loop);
  })();
  live.push({ stop: () => { alive = false; cancelAnimationFrame(raf); } });

  // ROS 2 sim + viz stack
  host.append(el("h3", "gp-subh", T.sim_stack));
  const grid = el("div", "sim-grid");
  GALLERY.physsim.simulators.forEach(s => grid.append(el("article", "sim-card" + (s.tag === "mine" ? " mine" : ""),
    `<div class="sim-card-top"><b>${s.name}</b><span class="sim-tag">${s.tag}</span></div><p>${ctx.pick(s, "note")}</p>`)));
  host.append(grid);
}
