/* Inside-a-sphere project gallery (phantom.land pattern), dependency-light.
   Project cards on the inner surface of a sphere; drag orbits with inertia;
   hover lifts; click opens the detail panel. */

import * as THREE from "three";
import { PROJECTS, IMG } from "./data.js";

const TAU = Math.PI * 2;

export function initSphere({ canvas, onPick, onHover, reducedMotion }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 60);
  camera.position.set(0, 0, 0.001);

  const rig = new THREE.Group();
  scene.add(rig);
  scene.add(new THREE.AmbientLight(0xffffff, 1.05));
  const key = new THREE.PointLight(0xff6b35, 16, 40); key.position.set(0, 3, 0); scene.add(key);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(15, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x0a1430, side: THREE.BackSide, transparent: true, opacity: 0.5 })
  );
  scene.add(dome);

  const R = 9;
  const loader = new THREE.TextureLoader();
  const cards = [];

  PROJECTS.forEach((item, i) => {
    const t = (i + 0.5) / PROJECTS.length;
    const phi = Math.acos(1 - 1.05 * t) - 0.05;
    const theta = i * TAU * 0.61803;
    const pos = new THREE.Vector3(
      R * Math.sin(phi) * Math.cos(theta),
      R * Math.cos(phi) * 0.6,
      R * Math.sin(phi) * Math.sin(theta)
    );

    loader.load(IMG(item.id, "w480"), tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const ratio = (tex.image.width / tex.image.height) || 1.4;
      const h = 2.7, w = h * ratio;
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 })
      );
      mesh.position.copy(pos); mesh.lookAt(0, 0, 0);
      mesh.userData = { item };

      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(w + 0.14, h + 0.14),
        new THREE.MeshBasicMaterial({ color: 0xff6b35, transparent: true, opacity: 0 })
      );
      frame.position.copy(pos.clone().multiplyScalar(1.004)); frame.lookAt(0, 0, 0);
      mesh.userData.frame = frame;

      rig.add(frame); rig.add(mesh); cards.push(mesh);

      const t0 = performance.now() + i * 85;
      (function fade() {
        const k = Math.min(1, (performance.now() - t0) / 600);
        if (k > 0) { mesh.material.opacity = k; frame.material.opacity = 0.6 * k; }
        if (k < 1) requestAnimationFrame(fade);
      })();
    });
  });

  let targetRY = 0, targetRX = 0, curRY = 0, curRX = 0, velY = 0;
  let dragging = false, px = 0, py = 0, moved = 0;
  const damp = 0.92, idle = reducedMotion ? 0 : 0.001;

  const onDown = e => { dragging = true; moved = 0; px = e.clientX ?? e.touches[0].clientX; py = e.clientY ?? e.touches[0].clientY; };
  const onMove = e => {
    const x = e.clientX ?? e.touches?.[0]?.clientX, y = e.clientY ?? e.touches?.[0]?.clientY;
    if (x == null) return;
    if (dragging) {
      const dx = x - px, dy = y - py;
      moved += Math.abs(dx) + Math.abs(dy);
      targetRY += dx * 0.0042; velY = dx * 0.0042;
      targetRX = THREE.MathUtils.clamp(targetRX + dy * 0.002, -0.4, 0.4);
      px = x; py = y;
    }
    const r = canvas.getBoundingClientRect();
    pointer.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  };
  const onUp = () => { dragging = false; };
  canvas.addEventListener("pointerdown", onDown);
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerup", onUp);

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);
  let hovered = null;

  canvas.addEventListener("click", () => {
    if (moved > 6 || !hovered) return;
    onPick(hovered.userData.item);
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize); resize();

  let visible = false, rafId = 0;
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !rafId) loop();
  }, { threshold: 0.04 }).observe(canvas);

  function loop() {
    if (!visible) { rafId = 0; return; }
    rafId = requestAnimationFrame(loop);
    if (!dragging) { targetRY += velY + idle; velY *= damp; }
    curRY += (targetRY - curRY) * 0.085;
    curRX += (targetRX - curRX) * 0.085;
    rig.rotation.set(curRX, curRY, 0);

    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(cards, false)[0]?.object ?? null;
    if (hit !== hovered) {
      if (hovered) hovered.userData.tgt = 1;
      hovered = hit;
      if (hovered) { hovered.userData.tgt = 1.12; canvas.style.cursor = "pointer"; onHover?.(hovered.userData.item.title); }
      else { canvas.style.cursor = "grab"; onHover?.(null); }
    }
    cards.forEach(c => {
      const s = c.userData.cur ?? 1, t = c.userData.tgt ?? 1;
      c.userData.cur = s + (t - s) * 0.14;
      c.scale.setScalar(c.userData.cur);
      c.userData.frame?.scale.setScalar(c.userData.cur);
    });
    renderer.render(scene, camera);
  }

  return { resize };
}

export function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch { return false; }
}
