/* Scroll-scrubbed cinematic frame-sequence engine (scroll-cinematic skill).
   Drives a <canvas> frame index from scroll progress over a sticky section.
   Graceful: if window.__CINEMATIC config or the section is absent, it no-ops —
   so the site runs fine before the Higgsfield video clip is sliced to frames. */

export function initCinematic({ section = "#cinematic", lenis, reduced } = {}) {
  const cfg = window.__CINEMATIC;           // { frameCount, framePath:(i)=>url, bg }
  const sec = document.querySelector(section);
  if (!cfg || !sec || reduced) return;      // nothing to scrub yet

  const canvas = sec.querySelector("canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const N = cfg.frameCount;
  const frames = [];
  let loaded = 0, cur = -1;

  for (let i = 0; i < N; i++) {
    const img = new Image();
    img.onload = () => { if (++loaded === 1) draw(0); };
    img.src = cfg.framePath(i);
    frames[i] = img;
  }

  function size() {
    const r = sec.getBoundingClientRect();
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    draw(cur < 0 ? 0 : cur, true);
  }
  addEventListener("resize", size);

  function draw(idx, force) {
    idx = Math.max(0, Math.min(N - 1, idx | 0));
    if (idx === cur && !force) return;
    cur = idx;
    const img = frames[idx]; if (!img || !img.complete) return;
    const cw = canvas.width, ch = canvas.height;
    const ir = img.width / img.height, cr = cw / ch;
    let w, h, x, y;
    if (ir > cr) { h = ch; w = ch * ir; x = (cw - w) / 2; y = 0; }
    else { w = cw; h = cw / ir; x = 0; y = (ch - h) / 2; }
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, x, y, w, h);
  }

  let progress = 0;
  function update() {
    const r = sec.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
    if (Math.abs(p - progress) > 0.0005) { progress = p; draw(p * (N - 1)); }
  }
  (lenis ? lenis.on("scroll", update) : addEventListener("scroll", update, { passive: true }));
  requestAnimationFrame(function loop() { update(); requestAnimationFrame(loop); });
  size();
}
