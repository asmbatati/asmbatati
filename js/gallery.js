/* Interactive interests gallery (page #gallery).
   Stage A: the generated emblem alone → click → six category cards burst out.
   Stage B: each category is a small "world":
     cad      — rotating 3D ring of CAD renders (click → lightbox)
     print    — Three.js turntable with floating procedural part meshes + real prints
     model    — live damped second-order system (canvas, ζ / ωn sliders)
     sim      — GPS-denied flight: truth vs estimate over a grid world (canvas)
     design   — rotating ring of machines → click → the design story
     robotics — Three.js viewer with a stylized model per platform */

import * as THREE from "three";
import { GALLERY, IMG } from "./data.js";

const qs = s => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

let ctx = null;                 // { pick, t, lang, reduced, lightbox }
let stage = "hub";              // hub | burst | world
let activeCat = null;
let live = [];                  // running scenes/loops to dispose on view change
const kill = () => { live.forEach(l => { try { l.stop(); } catch {} }); live = []; };
/* window-level listener that is removed when the view is torn down */
const onWin = (ev, fn) => { addEventListener(ev, fn); live.push({ stop: () => removeEventListener(ev, fn) }); };

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
  const R = narrow ? 0 : Math.min(innerWidth * 0.30, 330);
  GALLERY.cats.forEach((c, i) => {
    const card = el("button", "cat-card", `<span class="cc-icon">${c.icon}</span><b>${ctx.pick(c, "label")}</b><span class="cc-tease">${ctx.pick(c, "tease")}</span>`);
    if (!narrow) {
      const a = (-90 + i * 60) * Math.PI / 180;
      card.style.setProperty("--tx", `${Math.cos(a) * R * 1.25}px`);
      card.style.setProperty("--ty", `${Math.sin(a) * R * 0.72}px`);
    }
    card.addEventListener("click", () => { activeCat = c.id; stage = "world"; paint(); scrollTo({ top: 0, behavior: "instant" }); });
    wrap.append(card);
  });

  if (!emblem.__wired) {
    emblem.__wired = true;
    // animated emblem overlay — removes itself until vid/emblem.mp4 exists
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
        gsap.to("#hubEmblem", { scale: innerWidth < 760 ? 0.9 : 0.66, duration: 0.9, ease: "expo.out" });
      }
    });
  }
  if (stage === "burst") {
    if (!(window.gsap && !ctx.reduced)) qs("#hubEmblem").style.transform = innerWidth < 760 ? "scale(.9)" : "scale(.66)";
  } else {
    qs("#hubEmblem").style.transform = "";
    if (window.gsap) gsap.set("#hubEmblem", { clearProps: "all" });
  }
  window.__cursorBind?.();
}

function paintChips() {
  const bar = qs("#gpChips"); bar.innerHTML = "";
  GALLERY.cats.forEach(c => {
    const b = el("button", "gp-chip" + (c.id === activeCat ? " on" : ""), `${c.icon} ${ctx.pick(c, "label")}`);
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
  host.append(el("div", "gp-view-head",
    `<h2>${cat.icon} ${ctx.pick(cat, "label")}</h2><p class="gp-hint">${ctx.t()[id === "cad" ? "cad_hint" : id === "print" ? "print_hint" : id === "design" ? "design_hint" : id === "model" ? "math_note" : id === "sim" ? "sim_note" : "gp_drag"]}</p>`));
  ({ cad: viewCad, print: viewPrint, model: viewModel, sim: viewSim, design: viewDesign, robotics: viewRobotics })[id](host);
  window.__cursorBind?.();
}

/* ══════════ 3D ring carousel (CAD + Design) ══════════ */
function buildRing(host, items, makeFace, onPick) {
  const stageEl = el("div", "ring-stage");
  const ring = el("div", "ring3d");
  const n = items.length, cardW = Math.min(240, innerWidth * 0.55);
  const R = Math.round((cardW / 2) / Math.tan(Math.PI / n)) + 60;
  items.forEach((it, i) => {
    const slot = el("div", "ring-slot");
    slot.style.transform = `rotateY(${(360 / n) * i}deg) translateZ(${R}px)`;
    const c = el("div", "ring-card");
    c.style.width = cardW + "px";
    c.innerHTML = makeFace(it);
    c.addEventListener("click", () => { if (Math.abs(moved) < 8) onPick(it, i); });
    slot.append(c); ring.append(slot);
  });
  const cardH = cardW * 0.75 + 52;                       // image + caption
  const persp = 1400, scale = persp / (persp - R);       // front card apparent size
  stageEl.style.height = Math.round(cardH * scale) + 30 + "px";
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

/* ── CAD world ── */
function viewCad(host) {
  const items = GALLERY.cad.images;
  buildRing(host, items, it =>
    `<img src="${IMG(it.id, "w480")}" alt="${ctx.pick(it, "cap")}" loading="lazy"><figcaption>${ctx.pick(it, "cap")}</figcaption>`,
    (it, i) => ctx.lightbox(items, i));
  const chips = el("div", "gp-toolchips");
  GALLERY.cad.tools.forEach(t => chips.append(el("span", "chip", t)));
  host.append(chips);
}

/* ── Design world ── */
function viewDesign(host) {
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
  host.append(brief);
}

/* ══════════ Three.js helpers ══════════ */
function makeScene(host, h = 460) {
  const holder = el("div", "three-stage"); holder.style.height = h + "px";
  host.append(holder);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch { holder.replaceWith(el("p", "gp-hint", "WebGL unavailable — 3D view skipped.")); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  holder.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xfff8ec, 0x24352c, 1.05));
  const d1 = new THREE.DirectionalLight(0xffffff, 1.35); d1.position.set(2.5, 3.5, 2.5); scene.add(d1);
  const d2 = new THREE.DirectionalLight(0xd8e2d5, 0.45); d2.position.set(-2.5, 1.2, -2.5); scene.add(d2);
  const root = new THREE.Group(); scene.add(root);
  const size = () => {
    const w = holder.clientWidth, hh = holder.clientHeight;
    if (!w || !hh) return;                       // hidden/collapsed tab — keep the last real size
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
function props2(r, m, y = 0) { // crossed thin blades
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
    const arm = mesh(new THREE.BoxGeometry(L, 0.045, 0.07), M.dark, Math.cos(a) * L / 2, 0.02, Math.sin(a) * L / 2, 0, -a, 0);
    g.add(arm);
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
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.3, 18), M.cream, 0, -0.2, 0));  // tank / payload
  g.add(mesh(new THREE.SphereGeometry(0.09, 18, 14), M.dark, 0, -0.42, 0));           // gimbal ball
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
  g.add(mesh(new THREE.BoxGeometry(0.03, 0.02, 1.3), M.body, -0.62, 0.06, 0));          // tail spar
  g.add(mesh(new THREE.BoxGeometry(0.26, 0.02, 1.28), M.body, -0.72, 0.14, 0));         // tailplane
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
  g.add(mesh(new THREE.BoxGeometry(0.55, 0.04, 0.4), M.gold, 0, 0.24, 0));            // lift plate
  return g;
}
function buildBot(M) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.12, 26), M.dark, 0, -0.55, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.95, 26), M.cream, 0, 0, 0));
  g.add(mesh(new THREE.SphereGeometry(0.2, 26, 18, 0, Math.PI * 2, 0, Math.PI / 2), M.cream, 0, 0.48, 0));
  const screen = mesh(new THREE.BoxGeometry(0.24, 0.17, 0.02), M.dark, 0, 0.32, 0.23, -0.25, 0, 0);
  g.add(screen);
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.03, 0.42), M.body, 0, -0.28, -0.38));       // luggage deck
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
    thigh.userData.leg = i * Math.PI / 2; thigh.userData.baseZ = 0.55;   // trot phase per leg
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

/* ── Robotics world ── */
function viewRobotics(host) {
  const grid = el("div", "gp-robotics"); host.append(grid);
  const stageCol = el("div", "gpr-stage");
  const side = el("div", "gpr-side", `<div class="d-h">${ctx.t().gp_pick}</div>`);
  grid.append(stageCol, side);

  const sc = makeScene(stageCol, Math.min(480, innerWidth * 0.9));
  const caption = el("div", "gpr-caption"); stageCol.append(caption);
  stageCol.append(el("p", "gp-hint center", ctx.t().gp_drag));
  if (!sc) return;
  sc.camera.position.set(0, 0.9, 3.1); sc.camera.lookAt(0, 0, 0);
  const M = MAT();
  let current = null, rotY = 0, vel = 0, dragging = false, px = 0;

  const list = el("div", "gpr-list"); side.append(list);
  function select(p) {
    if (current) sc.root.remove(current);
    current = BUILDERS[p.id](M);
    current.position.y = -0.05;
    sc.root.add(current);
    if (window.gsap && !ctx.reduced) { current.scale.setScalar(0.001); gsap.to(current.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "expo.out" }); }
    caption.innerHTML = `<h3>${ctx.pick(p, "name")}</h3><p>${ctx.pick(p, "desc")}</p>
      <div class="gp-toolchips">${p.tags.map(t => `<span class="chip">${t}</span>`).join("")}</div>`;
    list.querySelectorAll(".gpr-item").forEach(b => b.classList.toggle("on", b.dataset.id === p.id));
  }
  GALLERY.robotics.platforms.forEach(p => {
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
  select(GALLERY.robotics.platforms[0]);
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

/* ── 3D-printing world: the turntable ── */
function gearGeom() {
  const s = new THREE.Shape(); const teeth = 12, r1 = 0.3, r2 = 0.38;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2, a1 = ((i + 0.4) / teeth) * Math.PI * 2, a2 = ((i + 0.5) / teeth) * Math.PI * 2, a3 = ((i + 0.9) / teeth) * Math.PI * 2;
    if (i === 0) s.moveTo(Math.cos(a0) * r2, Math.sin(a0) * r2);
    s.lineTo(Math.cos(a1) * r2, Math.sin(a1) * r2);
    s.lineTo(Math.cos(a2) * r1, Math.sin(a2) * r1);
    s.lineTo(Math.cos(a3) * r1, Math.sin(a3) * r1);
    s.lineTo(Math.cos((i + 1) / teeth * Math.PI * 2) * r2, Math.sin((i + 1) / teeth * Math.PI * 2) * r2);
  }
  const hole = new THREE.Path(); hole.absarc(0, 0, 0.09, 0, Math.PI * 2, true); s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
}
function bracketGeom() {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 0.12); s.lineTo(0.12, 0.12); s.lineTo(0.12, 0.5); s.lineTo(0, 0.5); s.closePath();
  [[0.36, 0.06], [0.06, 0.36]].forEach(([x, y]) => { const h = new THREE.Path(); h.absarc(x, y, 0.035, 0, Math.PI * 2, true); s.holes.push(h); });
  return new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false });
}
function vaseGeom() {
  const pts = [];
  [[0.02, 0], [0.2, 0], [0.24, 0.06], [0.14, 0.28], [0.16, 0.44], [0.24, 0.55], [0.22, 0.58]].forEach(([x, y]) => pts.push(new THREE.Vector2(x, y)));
  return new THREE.LatheGeometry(pts, 26);
}
function buildParts(M) {
  const mk = [];
  const gear = mesh(gearGeom(), M.gold); gear.geometry.center(); mk.push(gear);
  const bracket = mesh(bracketGeom(), M.body); bracket.geometry.center(); mk.push(bracket);
  const knob = new THREE.Group();
  knob.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 6), M.cream));
  knob.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.26, 14), M.dark, 0, 0.12, 0)); mk.push(knob);
  const vase = mesh(vaseGeom(), M.cream); vase.position.y = -0.25; const vg = new THREE.Group(); vg.add(vase); mk.push(vg);
  const cam = new THREE.Group();
  cam.add(mesh(new THREE.BoxGeometry(0.5, 0.15, 0.13), M.body));
  [-0.16, 0.16].forEach(x => cam.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 14), M.gold, x, 0, 0.08, Math.PI / 2, 0, 0)));
  mk.push(cam);                                                       // RoboEye stereo enclosure
  const imp = new THREE.Group();
  imp.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.16, 16), M.gold));
  for (let i = 0; i < 6; i++) imp.add(mesh(new THREE.BoxGeometry(0.26, 0.11, 0.03), M.gold, Math.cos(i * Math.PI / 3) * 0.19, 0, Math.sin(i * Math.PI / 3) * 0.19, 0, -i * Math.PI / 3 + 0.5, 0));
  mk.push(imp);                                                       // impeller
  return mk;
}
function viewPrint(host) {
  const sc = makeScene(host, Math.min(500, innerWidth * 0.95));
  if (sc) {
    sc.camera.position.set(0, 1.5, 3.6); sc.camera.lookAt(0, 0.2, 0);
    const M = MAT();
    sc.root.add(mesh(new THREE.CylinderGeometry(1.55, 1.62, 0.09, 48), M.cream, 0, -0.55, 0));
    sc.root.add(mesh(new THREE.TorusGeometry(1.585, 0.018, 12, 64), M.gold, 0, -0.505, 0, Math.PI / 2, 0, 0));
    const parts = buildParts(M);
    const n = parts.length;
    parts.forEach((p, i) => {
      const a = (i / n) * Math.PI * 2;
      const holder = new THREE.Group();
      holder.position.set(Math.cos(a) * 1.0, 0.15, Math.sin(a) * 1.0);
      holder.userData.phase = a; holder.add(p);
      p.scale.setScalar(1.15);
      sc.root.add(holder);
    });
    let rot = 0, vel = 0, dragging = false, px = 0;
    const cv = sc.renderer.domElement;
    cv.style.touchAction = "pan-y";
    cv.addEventListener("pointerdown", e => { dragging = true; px = e.clientX; });
    onWin("pointermove", e => { if (!dragging) return; const dx = e.clientX - px; px = e.clientX; vel = dx * 0.004; rot += dx * 0.008; });
    onWin("pointerup", () => dragging = false);
    sc.start(t => {
      if (!dragging) { rot += ctx.reduced ? 0 : 0.0045 + vel; vel *= 0.94; }
      sc.root.rotation.y = rot;
      sc.root.children.forEach(o => {
        if (o.userData.phase != null) {
          o.position.y = 0.15 + (ctx.reduced ? 0 : Math.sin(t * 1.1 + o.userData.phase * 2) * 0.09);
          o.children[0].rotation.y = ctx.reduced ? 0 : t * 0.5 + o.userData.phase;
        }
      });
    });
    host.append(el("p", "gp-hint center", ctx.t().gp_drag));
  }
  const strip = el("div", "print-strip");
  GALLERY.print.photos.forEach((p, i) => {
    const f = el("figure", "gItem", `<img src="${IMG(p.id, "w480")}" alt="${ctx.pick(p, "cap")}" loading="lazy"><figcaption>${ctx.pick(p, "cap")}</figcaption>`);
    f.addEventListener("click", () => ctx.lightbox(GALLERY.print.photos, i));
    strip.append(f);
  });
  host.append(strip);
}

/* ── Physics & math world: live 2nd-order system ── */
function viewModel(host) {
  const wrap = el("div", "math-wrap",
    `<div class="math-eq">ẍ + 2ζω<sub>n</sub>ẋ + ω<sub>n</sub>²x = 0</div>
     <div class="math-grid"><canvas id="mSpring"></canvas><canvas id="mPlot"></canvas></div>
     <div class="math-controls">
       <label>${ctx.t().math_zeta} <input type="range" id="mZeta" min="0.02" max="1.2" step="0.01" value="0.12"><b id="mZetaV">0.12</b></label>
       <label>${ctx.t().math_wn} <input type="range" id="mWn" min="1" max="8" step="0.1" value="3"><b id="mWnV">3.0</b></label>
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
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      const h = dt / steps;
      v += (-2 * zeta * wn * v - wn * wn * x) * h;
      x += v * h;
    }
    trace.push(x); if (trace.length > 360) trace.shift();

    /* spring + mass */
    xs.clearRect(0, 0, W1, H);
    xs.strokeStyle = dim; xs.lineWidth = 1;
    xs.strokeRect(W1 / 2 - 40, 8, 80, 6);
    const y0 = 40, yM = 150 + x * 70;
    xs.beginPath(); xs.moveTo(W1 / 2, 14); xs.lineTo(W1 / 2, y0);
    const coils = 9;
    for (let i = 0; i <= coils; i++) {
      const t = i / coils;
      xs.lineTo(W1 / 2 + (i === 0 || i === coils ? 0 : (i % 2 ? 16 : -16)), y0 + (yM - 26 - y0) * t);
    }
    xs.lineTo(W1 / 2, yM - 20);
    xs.strokeStyle = green; xs.lineWidth = 2; xs.stroke();
    xs.fillStyle = ink; xs.fillRect(W1 / 2 - 26, yM - 20, 52, 40);
    xs.fillStyle = gold; xs.fillRect(W1 / 2 - 26, yM - 20, 52, 5);
    xs.fillStyle = dim; xs.font = "12px Inter"; xs.textAlign = "center";
    xs.fillText("m", W1 / 2, yM + 6);

    /* time trace + phase inset */
    xp.clearRect(0, 0, W2, H);
    xp.strokeStyle = "rgba(22,53,42,.12)"; xp.lineWidth = 1;
    xp.beginPath(); xp.moveTo(0, H / 2); xp.lineTo(W2, H / 2); xp.stroke();
    xp.strokeStyle = green; xp.lineWidth = 2; xp.beginPath();
    trace.forEach((tx, i) => { const px2 = (i / 360) * W2, py = H / 2 - tx * 90; i ? xp.lineTo(px2, py) : xp.moveTo(px2, py); });
    xp.stroke();
    /* phase portrait inset */
    const ix = W2 - 120, iy = 14, iw = 106, ih = 106;
    xp.strokeStyle = "rgba(22,53,42,.2)"; xp.strokeRect(ix, iy, iw, ih);
    xp.fillStyle = "rgba(242,236,225,.75)"; xp.fillRect(ix, iy, iw, ih);
    xp.strokeStyle = gold; xp.lineWidth = 1.4; xp.beginPath();
    xp.arc(ix + iw / 2 + x * 34, iy + ih / 2 + v / wn * 34, 2.4, 0, Math.PI * 2); xp.stroke();
    xp.fillStyle = dim; xp.font = "10px Inter"; xp.textAlign = "left";
    xp.fillText("x–ẋ", ix + 6, iy + 14);
    raf = requestAnimationFrame(loop);
  })(0);
  live.push({ stop: () => { alive = false; cancelAnimationFrame(raf); } });
}

/* ── Simulation world: GPS-denied truth vs estimate ── */
function viewSim(host) {
  const wrap = el("div", "sim-wrap", `<canvas id="simCv"></canvas>
    <div class="sim-legend"><span class="sl-truth">— truth</span><span class="sl-est">– – estimate</span><span class="sl-fix">◉ correction</span></div>
    <div class="gp-toolchips">${GALLERY.sim.chips.map(c => `<span class="chip">${c}</span>`).join("")}</div>`);
  host.append(wrap);
  const cv = wrap.querySelector("#simCv"), g = cv.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = Math.min(880, innerWidth * 0.92), H = 400;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  /* waypoint course */
  const wps = [[0.08, 0.75], [0.25, 0.4], [0.45, 0.62], [0.62, 0.28], [0.8, 0.5], [0.92, 0.25]].map(([x, y]) => [x * W, y * H]);
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const pos = t => { const seg = Math.min(Math.floor(t), wps.length - 2); return lerp(wps[seg], wps[seg + 1], t - seg); };

  let T = 0, drift = [0, 0], est = [], truth = [], fixes = [];
  let raf, alive = true;
  (function loop() {
    if (!alive) return;
    T += ctx.reduced ? 0 : 0.006 * (wps.length - 1) / 3;
    if (T >= wps.length - 1) { T = 0; drift = [0, 0]; est = []; truth = []; fixes = []; }
    const p = pos(T);
    drift[0] += (Math.random() - 0.5) * 1.6; drift[1] += (Math.random() - 0.5) * 1.6;
    const seg = Math.floor(T);
    if (T - seg < 0.012 && seg > 0 && !fixes.some(f => f.seg === seg)) { fixes.push({ seg, at: [...p] }); drift = [drift[0] * 0.15, drift[1] * 0.15]; }
    truth.push([...p]); est.push([p[0] + drift[0], p[1] + drift[1]]);
    if (truth.length > 900) { truth.shift(); est.shift(); }

    g.clearRect(0, 0, W, H);
    /* grid world */
    g.strokeStyle = "rgba(22,53,42,.08)"; g.lineWidth = 1;
    for (let x = 0; x <= W; x += 44) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y <= H; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    /* planned path */
    g.strokeStyle = "rgba(22,53,42,.25)"; g.setLineDash([3, 7]); g.beginPath();
    wps.forEach((w, i) => i ? g.lineTo(w[0], w[1]) : g.moveTo(w[0], w[1])); g.stroke(); g.setLineDash([]);
    wps.forEach(w => { g.fillStyle = "#f2ece1"; g.strokeStyle = "#8a978c"; g.beginPath(); g.arc(w[0], w[1], 5, 0, Math.PI * 2); g.fill(); g.stroke(); });
    /* truth */
    g.strokeStyle = "#2f6b4f"; g.lineWidth = 2.2; g.beginPath();
    truth.forEach((w, i) => i ? g.lineTo(w[0], w[1]) : g.moveTo(w[0], w[1])); g.stroke();
    /* estimate */
    g.strokeStyle = "#b6803a"; g.lineWidth = 1.6; g.setLineDash([6, 5]); g.beginPath();
    est.forEach((w, i) => i ? g.lineTo(w[0], w[1]) : g.moveTo(w[0], w[1])); g.stroke(); g.setLineDash([]);
    /* corrections */
    fixes.forEach(f => { g.strokeStyle = "#b6803a"; g.beginPath(); g.arc(f.at[0], f.at[1], 9, 0, Math.PI * 2); g.stroke(); });
    /* drone */
    g.fillStyle = "#16352a"; g.beginPath(); g.arc(p[0], p[1], 6, 0, Math.PI * 2); g.fill();
    const e = est[est.length - 1];
    if (e) { g.fillStyle = "#b6803a"; g.beginPath(); g.arc(e[0], e[1], 4, 0, Math.PI * 2); g.fill(); }
    raf = requestAnimationFrame(loop);
  })();
  live.push({ stop: () => { alive = false; cancelAnimationFrame(raf); } });
}
