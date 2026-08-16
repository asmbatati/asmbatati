/* Build the Mind Maps SVGs in the portfolio's own theme.
   Run from site/:  node tools/build_mindmaps.mjs

   One generator, shared primitives — the diagrams have to read as one family,
   and hand-authoring ten of them separately guarantees they won't.

   Static .svg (not the inline foreignObject trick renderArch uses): an SVG loaded
   through <img> gets an isolated context — no page CSS vars, no web fonts, and
   foreignObject is not rendered at all. So the palette is baked in as literals
   (kept in sync with :root below) and every label is a real <text>. */
import fs from "node:fs";
import path from "node:path";

const OUT = new URL("../img/mindmaps/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/* ── the site palette, copied from css/main.css :root ── */
const C = {
  snow: "#fbfaf6", paper: "#f2ece1", paper2: "#eae2d4",
  g0: "#16352a", g1: "#21503d", g2: "#2f6b4f", g3: "#4d8a6a",
  gold: "#b6803a", slate: "#4a6b7c", mid: "#5c6f63", dim: "#8a978c",
  line: "rgba(22,53,42,0.14)", card: "#ffffff",
  perc: "#eef4f0", cog: "#f7f3ec", sup: "#f1ece2",
};
const DISP = "Fraunces, Georgia, 'Times New Roman', serif";
const BODY = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const warn = [];

/* Rough advance widths so an overflowing label is caught here rather than in the
   browser. Fraunces is a touch wider than Inter at the same size. */
const wOf = (s, size, disp) => s.length * size * (disp ? 0.54 : 0.515);
function fit(text, size, max, where, disp) {
  if (wOf(text, size, disp) > max) warn.push(`${where}: "${text}" ~${Math.round(wOf(text, size, disp))}px > ${max}px`);
  return esc(text);
}

const STYLE = `
  .bg   { fill: ${C.snow} }
  .nd   { fill: ${C.card}; stroke: ${C.line}; stroke-width: 1 }
  .nd.perc   { fill: ${C.perc} }
  .nd.cog    { fill: ${C.cog} }
  .nd.hw     { fill: ${C.paper2} }
  .nd.paper  { fill: ${C.paper} }
  .nd.dark   { fill: ${C.g0}; stroke: ${C.g0} }
  .nd.sup    { fill: ${C.sup}; stroke: ${C.g3}; stroke-dasharray: 5 4 }
  .nd.mine   { stroke: ${C.g2}; stroke-width: 1.6 }
  .nd.gold   { fill: #f7efe1; stroke: ${C.gold} }
  .nd.slate  { fill: #eef2f4; stroke: ${C.slate} }
  .panel     { fill: none; stroke: ${C.line}; stroke-width: 1; stroke-dasharray: 6 5 }
  .panel.solid { stroke-dasharray: none }
  .band      { stroke: rgba(22,53,42,0.05); stroke-width: 1 }
  .band.delib  { fill: rgba(77,138,106,0.05) }
  .band.react  { fill: rgba(47,107,79,0.045) }
  .band.reflex { fill: rgba(182,128,58,0.055) }
  .ttl  { font-family: ${DISP}; font-weight: 600; fill: ${C.g0} }
  .lbl  { font-family: ${DISP}; font-weight: 600; fill: ${C.g0} }
  .lbl.on-dark { fill: ${C.snow} }
  .sub  { font-family: ${BODY}; fill: ${C.mid} }
  .sub.on-dark { fill: #b9d0c3 }
  .col  { font-family: ${DISP}; font-weight: 600; fill: ${C.g2} }
  .edge { font-family: ${BODY}; fill: ${C.dim} }
  .edge.gold  { fill: ${C.gold}; font-weight: 600 }
  .edge.green { fill: ${C.g2}; font-weight: 600 }
  .mono { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; fill: ${C.g1} }
  .flow  { stroke: ${C.g1}; stroke-width: 2.2; fill: none; marker-end: url(#m-flow) }
  .share { stroke: ${C.g3}; stroke-width: 1.6; fill: none; marker-start: url(#m-share); marker-end: url(#m-share) }
  .react { stroke: ${C.dim}; stroke-width: 1.6; fill: none; stroke-dasharray: 5 4; marker-end: url(#m-react) }
  .emerg { stroke: ${C.gold}; stroke-width: 2.6; fill: none; stroke-dasharray: 7 4; marker-end: url(#m-emerg) }
  .super { stroke: ${C.g2}; stroke-width: 1.4; fill: none; stroke-dasharray: 3 4; opacity: .8; marker-start: url(#m-sup); marker-end: url(#m-sup) }
  .thin  { stroke: ${C.g3}; stroke-width: 1.4; fill: none; marker-end: url(#m-share) }
  .dot   { fill: ${C.g2} }
`;

const DEFS = `
  <marker id="m-flow"  markerWidth="9" markerHeight="9" refX="6.5" refY="3"   orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="${C.g1}"/></marker>
  <marker id="m-share" markerWidth="8" markerHeight="8" refX="5.5" refY="2.6" orient="auto"><path d="M0,0 L6,2.6 L0,5.2 Z" fill="${C.g3}"/></marker>
  <marker id="m-react" markerWidth="8" markerHeight="8" refX="5.5" refY="2.6" orient="auto"><path d="M0,0 L6,2.6 L0,5.2 Z" fill="${C.dim}"/></marker>
  <marker id="m-emerg" markerWidth="9" markerHeight="9" refX="6.5" refY="3"   orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="${C.gold}"/></marker>
  <marker id="m-sup"   markerWidth="8" markerHeight="8" refX="5.5" refY="2.6" orient="auto"><path d="M0,0 L6,2.6 L0,5.2 Z" fill="${C.g2}"/></marker>
`;

/* ── primitives ───────────────────────────────────────────────── */

// A node: rounded rect + a display-face title and any number of muted sub-lines,
// all vertically centred as one block.
function node({ x, y, w, h, kind = "", title = "", sub = [], mine = false, ts = 13, ss = 9.8, id = "" }) {
  const dark = kind.includes("dark");
  const lines = [];
  const titles = Array.isArray(title) ? title : (title ? [title] : []);
  const th = titles.length * (ts * 1.16);
  const sh = sub.reduce((a, s) => a + ss * (Array.isArray(s) ? 1.74 : 1.36), 0);
  let cy = y + h / 2 - (th + sh) / 2 + ts * 0.86;
  titles.forEach(t => {
    lines.push(`<text x="${x + w / 2}" y="${cy.toFixed(1)}" class="lbl${dark ? " on-dark" : ""}" font-size="${ts}" text-anchor="middle">${fit(t, ts, w - 16, id || t, true)}</text>`);
    cy += ts * 1.16;
  });
  cy += ss * 0.2;
  sub.forEach(s => {
    // An array entry is math — rendered with real tspan sub/superscripts rather
    // than the unicode subscript block, whose letter forms (ₖ, ᵢ, ₙ) are missing
    // from Segoe UI and fall back to a mismatched face.
    if (Array.isArray(s)) lines.push(mathLine(x + w / 2, cy, s, ss + 1.2, dark));
    else if (s) lines.push(`<text x="${x + w / 2}" y="${cy.toFixed(1)}" class="sub${dark ? " on-dark" : ""}" font-size="${ss}" text-anchor="middle">${fit(s, ss, w - 14, id || s)}</text>`);
    // Math needs more leading than prose: sub/superscripts push the glyph box well
    // past the em, so 1.24 lets a superscript touch the line above it.
    cy += ss * (Array.isArray(s) ? 1.74 : 1.36);
  });
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" class="nd ${kind}${mine ? " mine" : ""}"/>`
    + (mine ? `<circle cx="${x + w - 11}" cy="${y + 11}" r="3.5" class="dot"/>` : "")
    + lines.join("");
}

// A centred formula. Parts are strings, or {t, sub, sup} for a sub/superscript.
function mathLine(cx, y, parts, fs, dark = false) {
  const body = parts.map(p => {
    if (typeof p === "string") return esc(p);
    let s = p.t ? esc(p.t) : "";
    if (p.sub) s += `<tspan font-size="${(fs * 0.66).toFixed(1)}" baseline-shift="-22%">${esc(p.sub)}</tspan>`;
    if (p.sup) s += `<tspan font-size="${(fs * 0.66).toFixed(1)}" baseline-shift="34%">${esc(p.sup)}</tspan>`;
    return s;
  }).join("");
  return `<text x="${cx}" y="${y.toFixed(1)}" class="mono${dark ? " on-dark" : ""}" font-size="${fs}" text-anchor="middle" fill="${dark ? C.snow : C.g1}">${body}</text>`;
}

// Left-aligned node for bullet stacks (world model, variable panels).
function listNode({ x, y, w, h, kind = "", title = "", items = [], ts = 13, ss = 9.8, pad = 12 }) {
  const dark = kind.includes("dark");
  const out = [`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" class="nd ${kind}"/>`];
  let cy = y + pad + ts * 0.9;
  (Array.isArray(title) ? title : [title]).filter(Boolean).forEach(t => {
    out.push(`<text x="${x + pad}" y="${cy.toFixed(1)}" class="lbl${dark ? " on-dark" : ""}" font-size="${ts}">${fit(t, ts, w - pad * 2, t, true)}</text>`);
    cy += ts * 1.2;
  });
  cy += 4;
  items.forEach(t => {
    // "" is a deliberate spacer: it advances the cursor without emitting an empty
    // <text>, which would otherwise sit at 0,0 and trip the geometry checker.
    if (t) out.push(`<text x="${x + pad}" y="${cy.toFixed(1)}" class="sub${dark ? " on-dark" : ""}" font-size="${ss}">${fit(t, ss, w - pad * 2, t)}</text>`);
    cy += ss * 1.42;
  });
  return out.join("");
}

// A dashed grouping frame with a caption sitting on its top edge.
function panel({ x, y, w, h, label, solid = false, fs = 12 }) {
  const tw = wOf(label, fs, true) + 14;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" class="panel${solid ? " solid" : ""}"/>`
    + `<rect x="${x + 16}" y="${y - fs * 0.72}" width="${tw}" height="${fs * 1.45}" fill="${C.snow}"/>`
    + `<text x="${x + 23}" y="${y + fs * 0.36}" class="col" font-size="${fs}">${esc(label)}</text>`;
}

const arrow = (d, cls = "flow") => `<path d="${d}" class="${cls}"/>`;
const label = (x, y, t, cls = "edge", fs = 9.5, anchor = "middle") =>
  `<text x="${x}" y="${y}" class="${cls}" font-size="${fs}" text-anchor="${anchor}">${esc(t)}</text>`;

// Inline math with real sub/superscripts — safer and better set than the unicode
// subscript block, which is patchy in fallback fonts.
function math(x, y, parts, fs = 13, anchor = "start", cls = "mono") {
  const body = parts.map(p => {
    if (typeof p === "string") return esc(p);
    let s = "";
    if (p.t) s += esc(p.t);
    if (p.sub) s += `<tspan font-size="${(fs * 0.68).toFixed(1)}" dy="${(fs * 0.24).toFixed(1)}">${esc(p.sub)}</tspan><tspan dy="${(-fs * 0.24).toFixed(1)}"></tspan>`;
    if (p.sup) s += `<tspan font-size="${(fs * 0.68).toFixed(1)}" dy="${(-fs * 0.38).toFixed(1)}">${esc(p.sup)}</tspan><tspan dy="${(fs * 0.38).toFixed(1)}"></tspan>`;
    return s;
  }).join("");
  return `<text x="${x}" y="${y}" class="${cls}" font-size="${fs}" text-anchor="${anchor}">${body}</text>`;
}

function legend(x, y, items, fs = 10) {
  let cx = x;
  return items.map(([kind, text]) => {
    const swatch = kind === "mine"
      ? `<circle cx="${cx + 6}" cy="${y - 3}" r="5.5" fill="none" stroke="${C.g2}" stroke-width="1.6"/>`
      : `<line x1="${cx}" y1="${y - 3}" x2="${cx + 20}" y2="${y - 3}" class="${kind}" style="marker-end:none;marker-start:none"/>`;
    const t = `<text x="${cx + 26}" y="${y}" class="edge" font-size="${fs}" text-anchor="start">${esc(text)}</text>`;
    cx += 26 + wOf(text, fs) + 20;
    return swatch + t;
  }).join("");
}

function svg({ w, h, title, desc, body, titleY = 34, titleSize = 22 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet"
     role="img" aria-labelledby="t d">
  <title id="t">${esc(title)}</title>
  <desc id="d">${esc(desc)}</desc>
  <defs>${DEFS}</defs>
  <style>${STYLE}</style>
  <rect width="${w}" height="${h}" class="bg"/>
  <text x="${w / 2}" y="${titleY}" class="ttl" font-size="${titleSize}" text-anchor="middle">${esc(title)}</text>
${body}
</svg>
`;
}

const write = (name, s) => { fs.writeFileSync(path.join(OUT, name), s, "utf8"); console.log(`  ${name}  ${(s.length / 1024).toFixed(1)} KB`); };

/* ══════════════ 1 · Robotic Cognitive Stack ══════════════
   Same layout as renderArch() so the standalone file and the live diagram in the
   blog post are recognisably the same drawing. */
{
  const B = {
    semantic: [64, 116, 222, 84], spatial: [64, 220, 222, 84], stateest: [64, 324, 222, 84],
    task: [636, 116, 210, 84], motion: [636, 220, 210, 84], control: [636, 324, 210, 84],
    world: [356, 128, 210, 280], super: [866, 116, 128, 292],
    sensors: [64, 450, 222, 84], actuators: [636, 450, 210, 84], env: [64, 576, 782, 64],
  };
  const n = (k, o) => node({ x: B[k][0], y: B[k][1], w: B[k][2], h: B[k][3], id: k, ...o });
  const bands = [["delib", 112, "Deliberative", "0.1–10 Hz"], ["react", 216, "Reactive", "10–50 Hz"], ["reflex", 320, "Reflex", "100 Hz–1 kHz"]];
  const body = [
    bands.map(([id, y]) => `<rect x="58" y="${y}" width="790" height="92" rx="12" class="band ${id}"/>`).join(""),
    bands.map(([, y, l, r]) =>
      `<text x="30" y="${y + 42}" class="lbl" font-size="8" text-anchor="middle">${l}</text>` +
      `<text x="30" y="${y + 53}" class="sub" font-size="7" text-anchor="middle">${r}</text>`).join(""),
    label(175, 100, "Perception ↑", "col", 14), label(741, 100, "Decision & control ↓", "col", 14),
    ["M175,576 L175,534", "M175,450 L175,408", "M175,324 L175,304", "M175,220 L175,200",
      "M741,200 L741,220", "M741,304 L741,324", "M741,408 L741,450", "M741,534 L741,576"].map(d => arrow(d)).join(""),
    ["M286,158 L356,158", "M286,262 L356,262", "M566,158 L636,158", "M566,262 L636,262"].map(d => arrow(d, "share")).join(""),
    arrow("M286,278 L320,278 L320,430 L600,430 L600,366 L636,366", "emerg"),
    arrow("M741,534 L741,556 L336,556 L336,366 L286,366", "react"),
    ["M846,158 L866,158", "M846,262 L866,262", "M846,366 L866,366"].map(d => arrow(d, "super")).join(""),
    label(455, 424, "Emergency reflex", "edge gold"),
    label(455, 550, "Proprioceptive feedback"),
    n("semantic", { title: "Semantic Perception", sub: ["Detection · segmentation", "scene understanding"], mine: true }),
    n("spatial", { title: "Spatial Perception", sub: ["SLAM · point clouds", "local maps"], mine: true }),
    n("stateest", { title: "State Estimation", sub: ["Kalman filter · EKF · VIO", "sensor fusion"], mine: true }),
    n("task", { title: "Task Planning", sub: ["Behaviour trees · FSM", "mission logic"], mine: true }),
    n("motion", { title: "Motion Planning", sub: ["RRT · DWA", "trajectory generation"], mine: true }),
    n("control", { title: "Real-time Control", sub: ["PID · MPC", "torque control"], mine: true }),
    listNode({ x: B.world[0], y: B.world[1], w: B.world[2], h: B.world[3], kind: "dark", ts: 13, ss: 9.8,
      title: ["Shared World Model"], items: ["Semantic + geometric map", "", "· Object poses & states", "· Occupancy grid", "· Robot state", "· Dynamic obstacles", "· Goal locations"] }),
    listNode({ x: B.super[0], y: B.super[1], w: B.super[2], h: B.super[3], kind: "sup", ts: 11.5, ss: 9, pad: 10,
      title: ["Supervisory", "& Monitoring"], items: ["· Fault detection", "· Plan validation", "· Recovery", "· Safety limits", "· Metrics"] }),
    n("sensors", { title: "Sensors", sub: ["Cameras · LiDAR · IMU · encoders"], kind: "hw", mine: true }),
    n("actuators", { title: "Actuators", sub: ["Motors · ESCs · grippers"], kind: "hw" }),
    n("env", { title: "Dynamic Environment", sub: ["Moving obstacles · humans · changing conditions"], kind: "paper", ts: 12.5, ss: 9.5 }),
    legend(64, 664, [["flow", "Standard flow"], ["share", "Shared world-model data"], ["react", "Reactive feedback"], ["emerg", "Emergency reflex"], ["mine", "Blocks I built / published"]]),
  ].join("\n");
  write("robotic-cognitive-stack.svg", svg({
    w: 1010, h: 682, title: "The Robotic Cognitive Stack",
    desc: "A closed-loop autonomous-robot architecture. Perception ascends on the left from sensors through state estimation, spatial perception and semantic perception. Decision and control descend on the right from task planning through motion planning to real-time control and the actuators. Both columns exchange data with a shared world model at the centre, a supervisory and monitoring system watches the three decision layers, and everything is grouped into three timing bands: deliberative at 0.1 to 10 hertz, reactive at 10 to 50 hertz, and reflex at 100 hertz to 1 kilohertz.",
    body,
  }));
}

/* ══════════════ 2–4 · the Kalman family ══════════════
   One layout, three variants: the loop is identical and only the boxes change,
   which is the actual point being made about EKF and UKF. */
function kalman({ file, title, desc, predict, measure, innov, gain, update, notes, vars, extra = [], h = 700 }) {
  const W = 1040;
  const body = [
    // top row: initial → previous → predict
    node({ x: 40, y: 96, w: 132, h: 86, kind: "paper", title: "Initial state", sub: [[{ t: "x̂", sub: "0" }, " , ", { t: "P", sub: "0" }]], ts: 12, ss: 11 }),
    node({ x: 224, y: 96, w: 156, h: 86, kind: "paper", title: "Previous state", sub: [[{ t: "x̂", sub: "k−1" }, " , ", { t: "P", sub: "k−1" }]], ts: 12, ss: 11 }),
    arrow("M172,139 L224,139"),
    label(198, 130, "becomes", "edge", 8.5),
    node({ x: 432, y: 84, w: 300, h: 110, kind: "perc", title: "Predict", sub: predict, mine: false, ts: 13, ss: 10 }),
    arrow("M380,139 L432,139"),
    label(486, 74, "State transition model", "col", 11),
    // measurement, right
    node({ x: 800, y: 84, w: 200, h: 110, kind: "cog", title: "Measurement", sub: measure, ts: 13, ss: 10 }),
    arrow("M732,139 L800,139"),
    label(766, 130, "predicted", "edge", 8.5),
    // innovation
    node({ x: 760, y: 258, w: 240, h: 104, kind: "nd", title: "Innovation", sub: innov, ts: 13, ss: 10 }),
    arrow("M900,194 L900,258"),
    // gain
    node({ x: 432, y: 268, w: 260, h: 84, kind: "nd", title: "Kalman gain", sub: gain, ts: 13, ss: 10, mine: false }),
    arrow("M760,310 L692,310"),
    arrow("M582,194 L582,268"),
    mathLine(632, 240, [{ t: "P′", sub: "k" }], 11),
    // update
    node({ x: 224, y: 424, w: 380, h: 96, kind: "perc", title: "Update", sub: update, ts: 13, ss: 10 }),
    arrow("M562,352 L562,424"),
    // output
    node({ x: 40, y: 424, w: 140, h: 96, kind: "paper", title: "Updated state", sub: [[{ t: "x̂", sub: "k" }, " , ", { t: "P", sub: "k" }]], ts: 12, ss: 11 }),
    arrow("M224,472 L180,472"),
    // loop back
    arrow("M110,424 L110,240 L302,240 L302,182", "react"),
    label(206, 232, "becomes the previous state", "edge", 9),
    ...extra,
    // notes + variables
    listNode({ x: 40, y: h - 152, w: 470, h: 132, kind: "paper", ts: 12, ss: 9.6,
      title: "The loop", items: notes }),
    listNode({ x: 540, y: h - 152, w: 460, h: 132, kind: "nd", ts: 12, ss: 9.6,
      title: "Symbols", items: vars }),
  ].join("\n");
  write(file, svg({ w: W, h, title, desc, body }));
}

kalman({
  file: "kalman-filter.svg",
  title: "Kalman Filter, end to end",
  desc: "The Kalman filter loop on one page: an initial state becomes the previous state, a linear model predicts the next state and covariance, a sensor measurement produces an innovation and its covariance, the Kalman gain weighs prediction against measurement, the state and covariance are updated, and the result becomes the previous state for the next cycle.",
  predict: [
    [{ t: "x̂′", sub: "k" }, " = A ", { t: "x̂", sub: "k−1" }, " + B ", { t: "u", sub: "k" }],
    [{ t: "P′", sub: "k" }, " = A ", { t: "P", sub: "k−1" }, { t: "A", sup: "T" }, " + ", { t: "Q", sub: "k" }],
  ],
  measure: [[{ t: "z", sub: "k" }, " = H ", { t: "x", sub: "k" }, " + ", { t: "v", sub: "k" }]],
  innov: [
    [{ t: "y", sub: "k" }, " = ", { t: "z", sub: "k" }, " − H ", { t: "x̂′", sub: "k" }],
    [{ t: "S", sub: "k" }, " = H ", { t: "P′", sub: "k" }, { t: "H", sup: "T" }, " + R"],
  ],
  gain: [[{ t: "K", sub: "k" }, " = ", { t: "P′", sub: "k" }, { t: "H", sup: "T" }, " ", { t: "S", sub: "k" }, { t: "", sup: "−1" }]],
  update: [
    [{ t: "x̂", sub: "k" }, " = ", { t: "x̂′", sub: "k" }, " + ", { t: "K", sub: "k" }, " ", { t: "y", sub: "k" }],
    [{ t: "P", sub: "k" }, " = (I − ", { t: "K", sub: "k" }, "H) ", { t: "P′", sub: "k" }, " (I − ", { t: "K", sub: "k" }, "H)", { t: "", sup: "T" }, " + ", { t: "K", sub: "k" }, "R", { t: "K", sub: "k" }, { t: "", sup: "T" }],
  ],
  notes: [
    "1 · Predict — push the state forward through the model",
    "2 · Measure — take what the sensor actually says",
    "3 · Weigh — the gain decides who to trust",
    "4 · Update — fuse the two into one estimate",
    "5 · Repeat — the output becomes the next input",
  ],
  vars: [
    "x state estimate  ·  P error covariance  ·  u control input",
    "A, B, H system matrices  ·  Q process noise covariance",
    "z measurement  ·  v measurement noise  ·  R its covariance",
    "y innovation — the new information the sensor brought",
    "S innovation covariance  ·  K Kalman gain  ·  I identity",
  ],
});

kalman({
  file: "extended-kalman-filter.svg",
  title: "Extended Kalman Filter",
  desc: "The Kalman loop with non-linear models. The state transition and measurement functions f and h replace the linear matrices, and two Jacobians, F and H, linearise them around the current estimate so the covariance can still be propagated.",
  predict: [
    [{ t: "x̂′", sub: "k" }, " = f(", { t: "x̂", sub: "k−1" }, " , ", { t: "u", sub: "k" }, ")"],
    [{ t: "P′", sub: "k" }, " = ", { t: "F", sub: "k" }, " ", { t: "P", sub: "k−1" }, " ", { t: "F", sub: "k" }, { t: "", sup: "T" }, " + ", { t: "Q", sub: "k" }],
  ],
  measure: [[{ t: "z", sub: "k" }, " = h(", { t: "x", sub: "k" }, ") + ", { t: "v", sub: "k" }]],
  innov: [
    [{ t: "y", sub: "k" }, " = ", { t: "z", sub: "k" }, " − h(", { t: "x̂′", sub: "k" }, ")"],
    [{ t: "S", sub: "k" }, " = ", { t: "H", sub: "k" }, " ", { t: "P′", sub: "k" }, " ", { t: "H", sub: "k" }, { t: "", sup: "T" }, " + R"],
  ],
  gain: [[{ t: "K", sub: "k" }, " = ", { t: "P′", sub: "k" }, " ", { t: "H", sub: "k" }, { t: "", sup: "T" }, " ", { t: "S", sub: "k" }, { t: "", sup: "−1" }]],
  update: [
    [{ t: "x̂", sub: "k" }, " = ", { t: "x̂′", sub: "k" }, " + ", { t: "K", sub: "k" }, " ", { t: "y", sub: "k" }],
    [{ t: "P", sub: "k" }, " = (I − ", { t: "K", sub: "k" }, { t: "H", sub: "k" }, ") ", { t: "P′", sub: "k" }, " (I − ", { t: "K", sub: "k" }, { t: "H", sub: "k" }, ")", { t: "", sup: "T" }, " + ", { t: "K", sub: "k" }, "R", { t: "K", sub: "k" }, { t: "", sup: "T" }],
  ],
  extra: [
    node({ x: 760, y: 396, w: 240, h: 92, kind: "gold", title: "The price: Jacobians", sub: [
      [{ t: "F", sub: "k" }, " = ∂f/∂x  at ", { t: "x̂", sub: "k−1" }, ", ", { t: "u", sub: "k" }],
      [{ t: "H", sub: "k" }, " = ∂h/∂x  at ", { t: "x̂′", sub: "k" }],
    ], ts: 12, ss: 10 }),
    arrow("M880,362 L880,396", "share"),
  ],
  notes: [
    "Same five steps as the linear filter — predict, measure,",
    "weigh, update, repeat.",
    "What changes: f and h may be non-linear, so the covariance",
    "is propagated through their Jacobians instead.",
    "Cost: the linearisation is only valid near the estimate.",
  ],
  vars: [
    "f non-linear state transition    h non-linear measurement",
    "F Jacobian of f — linearises the motion model",
    "H Jacobian of h — linearises the sensor model",
    "y innovation  ·  S innovation covariance  ·  K Kalman gain",
    "Q, R process and measurement noise covariance",
  ],
});

/* UKF — different enough in the middle that it gets its own layout. */
{
  const W = 1060, H = 760;
  const body = [
    node({ x: 40, y: 96, w: 150, h: 86, kind: "paper", title: "Previous state", sub: [[{ t: "x̂", sub: "k−1" }, " , ", { t: "P", sub: "k−1" }]], ts: 12, ss: 11 }),
    node({ x: 240, y: 84, w: 310, h: 110, kind: "gold", title: "Sigma points", sub: [
      [{ t: "𝒳", sub: "k−1" }, " = [ x̂ ,  x̂ ± γ√", { t: "P", sub: "k−1" }, " ]"],
      [{ t: "γ" }, " = √(n + λ),   λ = ", { t: "α", sup: "2" }, "(n + κ) − n"],
    ], ts: 13, ss: 10 }),
    arrow("M190,139 L240,139"),
    label(395, 74, "2n + 1 representative samples", "col", 11),
    node({ x: 610, y: 84, w: 300, h: 110, kind: "perc", title: "Propagate", sub: [
      [{ t: "𝒳′", sub: "k,i" }, " = f(", { t: "𝒳", sub: "k−1,i" }, " , ", { t: "u", sub: "k" }, ")"],
      [{ t: "x̂′", sub: "k" }, " = Σ ", { t: "W", sub: "i" }, { t: "", sup: "(m)" }, " ", { t: "𝒳′", sub: "k,i" }],
      [{ t: "P′", sub: "k" }, " = Σ ", { t: "W", sub: "i" }, { t: "", sup: "(c)" }, " (𝒳′−x̂′)(𝒳′−x̂′)", { t: "", sup: "T" }, " + ", { t: "Q", sub: "k" }],
    ], ts: 13, ss: 9.4 }),
    arrow("M550,139 L610,139"),
    label(760, 74, "through the non-linear model", "col", 11),
    node({ x: 610, y: 250, w: 300, h: 96, kind: "cog", title: "Project into sensor space", sub: [
      [{ t: "𝒵", sub: "k,i" }, " = h(", { t: "𝒳′", sub: "k,i" }, ")"],
      [{ t: "ẑ", sub: "k" }, " = Σ ", { t: "W", sub: "i" }, { t: "", sup: "(m)" }, " ", { t: "𝒵", sub: "k,i" }],
    ], ts: 13, ss: 10 }),
    arrow("M760,194 L760,250"),
    node({ x: 610, y: 402, w: 300, h: 112, kind: "nd", title: "Innovation & cross-covariance", sub: [
      [{ t: "y", sub: "k" }, " = ", { t: "z", sub: "k" }, " − ", { t: "ẑ", sub: "k" }],
      [{ t: "S", sub: "k" }, " = Σ ", { t: "W", sub: "i" }, { t: "", sup: "(c)" }, " (𝒵−ẑ)(𝒵−ẑ)", { t: "", sup: "T" }, " + ", { t: "R", sub: "k" }],
      [{ t: "P", sub: "xz" }, " = Σ ", { t: "W", sub: "i" }, { t: "", sup: "(c)" }, " (𝒳′−x̂′)(𝒵−ẑ)", { t: "", sup: "T" }],
    ], ts: 12.5, ss: 9.4 }),
    arrow("M760,346 L760,402"),
    node({ x: 300, y: 410, w: 230, h: 84, kind: "nd", title: "Kalman gain", sub: [[{ t: "K", sub: "k" }, " = ", { t: "P", sub: "xz" }, " ", { t: "S", sub: "k" }, { t: "", sup: "−1" }]], ts: 13, ss: 10.5 }),
    arrow("M610,458 L530,458"),
    node({ x: 40, y: 556, w: 490, h: 92, kind: "perc", title: "Update", sub: [
      [{ t: "x̂", sub: "k" }, " = ", { t: "x̂′", sub: "k" }, " + ", { t: "K", sub: "k" }, " ", { t: "y", sub: "k" }],
      [{ t: "P", sub: "k" }, " = ", { t: "P′", sub: "k" }, " − ", { t: "K", sub: "k" }, " ", { t: "S", sub: "k" }, " ", { t: "K", sub: "k" }, { t: "", sup: "T" }],
    ], ts: 13, ss: 10.5 }),
    arrow("M415,494 L415,556"),
    arrow("M40,602 L20,602 L20,139 L40,139", "react"),
    label(96, 546, "becomes the previous state", "edge", 9),
    node({ x: 934, y: 250, w: 112, h: 264, kind: "sup", title: ["Weights"], sub: [
      [{ t: "W", sub: "0" }, { t: "", sup: "(m)" }, " = λ/(n+λ)"],
      [{ t: "W", sub: "0" }, { t: "", sup: "(c)" }, " = ", { t: "W", sub: "0" }, { t: "", sup: "(m)" }],
      [{ t: "+ 1 − α", sup: "2" }, " + β"],
      [{ t: "W", sub: "i" }, " = 1 / 2(n+λ)"],
      "for i = 1 … 2n",
    ], ts: 11.5, ss: 8.4 }),
    listNode({ x: 560, y: 556, w: 480, h: 152, kind: "paper", ts: 12, ss: 9.6,
      title: "Why bother",
      items: [
        "The EKF linearises; the UKF samples instead. No Jacobians —",
        "which matters when f or h is not differentiable in closed form.",
        "",
        "α spread of the sigma points (small, e.g. 1e−3)  ·  β prior",
        "knowledge of the distribution (2 is optimal for Gaussians)",
        "κ secondary scaling  ·  n state dimension  ·  𝒳, 𝒵 sigma points",
      ] }),
  ].join("\n");
  write("unscented-kalman-filter.svg", svg({
    w: W, h: H, title: "Unscented Kalman Filter",
    desc: "The unscented Kalman filter replaces linearisation with sampling. A set of 2n+1 sigma points is drawn from the previous mean and covariance, propagated through the non-linear motion model, recombined with weights into a predicted mean and covariance, projected into sensor space, and used to form the innovation covariance and the state-measurement cross-covariance from which the Kalman gain is computed. No Jacobians are required.",
    body,
  }));
}

/* ══════════════ 5 · GPS-denied localization taxonomy ══════════════ */
{
  const W = 1040, H = 590;
  const bub = (cx, cy, r, kind, lines, fs = 12, ts = true) => {
    const out = [`<circle cx="${cx}" cy="${cy}" r="${r}" class="nd ${kind}"/>`];
    let y = cy - (lines.length - 1) * fs * 0.69 + fs * 0.34;
    lines.forEach(l => { out.push(`<text x="${cx}" y="${y.toFixed(1)}" class="${ts ? "lbl" : "sub"}${kind.includes("dark") ? " on-dark" : ""}" font-size="${fs}" text-anchor="middle">${fit(l, fs, r * 1.85, l, ts)}</text>`); y += fs * 1.38; });
    return out.join("");
  };
  const body = [
    arrow("M456,278 L372,278", "thin"), arrow("M584,278 L668,278", "thin"),
    ["M256,244 L176,180", "M250,300 L166,332", "M300,346 L316,410"].map(d => arrow(d, "thin")).join(""),
    ["M784,244 L864,180", "M790,300 L874,332", "M740,346 L724,410"].map(d => arrow(d, "thin")).join(""),
    bub(520, 278, 96, "dark", ["Outdoor", "GPS-denied UAV", "localization"], 13),
    bub(300, 278, 78, "gold", ["Absolute", "localization"], 12.5),
    bub(740, 278, 78, "nd mine", ["Relative", "localization"], 12.5),
    bub(120, 154, 62, "paper", ["SatNav"], 11.5),
    bub(112, 356, 62, "paper", ["Template &", "feature", "matching"], 10.5),
    bub(336, 458, 62, "paper", ["Semantic", "mapping &", "recognition"], 10.5),
    bub(920, 154, 62, "perc", ["Visual-inertial", "odometry"], 10.5),
    bub(928, 356, 62, "perc", ["Dead reckoning,", "filtering &", "error optimization"], 9),
    bub(704, 458, 62, "perc", ["SLAM, visual", "odometry &", "optical flow"], 10),
    label(300, 190, "absolute fix, drift-free", "edge", 9.5),
    label(740, 190, "no fix, but always available", "edge", 9.5),
    label(520, 562, "The two halves fail in opposite ways — which is the whole argument for fusing them.", "edge", 11.5),
  ].join("\n");
  write("gps-denied-taxonomy.svg", svg({
    w: W, h: H, title: "Outdoor GPS-denied localization, mapped",
    desc: "A taxonomy of outdoor GPS-denied UAV localization. It splits into absolute localization, which covers satellite navigation, template and feature matching, and semantic mapping and recognition; and relative localization, which covers visual-inertial odometry, dead reckoning with filtering and error optimization, and SLAM with visual odometry and optical flow.",
    body,
  }));
}

/* ══════════════ 6 · Detect, track, predict ══════════════ */
{
  const W = 1180, H = 470;
  const body = [
    panel({ x: 34, y: 92, w: 330, h: 250, label: "Perception" }),
    panel({ x: 392, y: 92, w: 186, h: 250, label: "State estimation" }),
    panel({ x: 606, y: 92, w: 372, h: 250, label: "Target trajectory prediction" }),
    node({ x: 56, y: 190, w: 96, h: 74, kind: "hw", title: "Depth", sub: ["camera"], ts: 12, ss: 9.5 }),
    node({ x: 186, y: 122, w: 158, h: 76, kind: "cog", title: "Drone detection", sub: ["deep-learning · 15 Hz"], ts: 12, ss: 9.5, mine: true }),
    node({ x: 186, y: 236, w: 158, h: 76, kind: "cog", title: "Drone detection", sub: ["depth-based · 40 Hz"], ts: 12, ss: 9.5, mine: true }),
    arrow("M152,212 L186,178"), arrow("M152,238 L186,268"),
    arrow("M265,198 L265,236"),
    label(300, 116, "RGB", "edge", 9), label(300, 330, "depth", "edge", 9),
    node({ x: 414, y: 178, w: 142, h: 96, kind: "perc", title: "Multi-target", sub: ["tracking", "Kalman filter · 100 Hz"], ts: 12, ss: 9.5, mine: true }),
    arrow("M344,274 L414,240"),
    label(384, 168, "3D position", "edge", 9),
    node({ x: 628, y: 116, w: 158, h: 62, kind: "nd", title: "Model 1", sub: ["constant velocity"], ts: 11.5, ss: 9 }),
    node({ x: 628, y: 196, w: 158, h: 62, kind: "nd", title: "Model 2", sub: ["constant acceleration"], ts: 11.5, ss: 9 }),
    node({ x: 628, y: 276, w: 158, h: 62, kind: "nd", title: "Model N", sub: ["learned / manoeuvring"], ts: 11.5, ss: 9 }),
    ["M556,214 L600,147 L628,147", "M556,226 L600,227 L628,227", "M556,240 L600,307 L628,307"].map(d => arrow(d, "thin")).join(""),
    label(592, 108, "buffer", "edge", 9),
    node({ x: 828, y: 178, w: 128, h: 84, kind: "gold", title: "Best model", sub: ["selector"], ts: 12, ss: 9.5, mine: true }),
    ["M786,147 L812,147 L812,206 L828,206", "M786,227 L828,227", "M786,307 L812,307 L812,248 L828,248"].map(d => arrow(d, "thin")).join(""),
    node({ x: 1008, y: 130, w: 140, h: 76, kind: "paper", title: "Trajectory", sub: ["generation"], ts: 12, ss: 9.5 }),
    node({ x: 1008, y: 234, w: 140, h: 76, kind: "paper", title: "Trajectory", sub: ["tracker"], ts: 12, ss: 9.5 }),
    arrow("M956,206 L1078,206 L1078,206"), arrow("M1078,206 L1078,234"),
    label(1078, 122, "predicted target trajectory", "edge", 9),
    label(W / 2, 392, "Detection is the easy half. Everything after the buffer exists because a target that is only tracked is already too late.", "edge", 11.5),
    label(W / 2, 414, "The selector is what keeps a wrong motion model from confidently aiming at the wrong place.", "edge", 11.5),
  ].join("\n");
  write("detect-track-predict.svg", svg({
    w: W, h: H, title: "Detect, track, predict",
    desc: "The interception pipeline. A depth camera feeds two drone detectors, a deep-learning one at 15 hertz on RGB and a depth-based one at 40 hertz. Their 3D positions go to a 100 hertz multi-target Kalman filter, whose buffered track feeds a bank of trajectory-prediction models. A best-model selector picks among them and the predicted trajectory drives trajectory generation and the trajectory tracker.",
    body,
  }));
}

/* ══════════════ 7 · Trajectory dataset pipeline ══════════════ */
{
  const W = 1160, H = 620;
  const body = [
    panel({ x: 34, y: 92, w: 470, h: 180, label: "Flight (simulated)" }),
    node({ x: 56, y: 128, w: 128, h: 60, kind: "hw", title: "Gazebo", sub: ["physics · sensors"], ts: 12, ss: 9 }),
    node({ x: 56, y: 202, w: 128, h: 52, kind: "hw", title: "Actuators", ts: 12 }),
    node({ x: 212, y: 128, w: 128, h: 126, kind: "perc", title: "PX4", sub: ["control", "state estimation"], ts: 12, ss: 9 }),
    node({ x: 368, y: 128, w: 114, h: 126, kind: "cog", title: "MAVROS", sub: ["setpoints", "feedback"], ts: 12, ss: 9 }),
    arrow("M184,158 L212,158"), arrow("M212,228 L184,228"),
    arrow("M340,191 L368,191"),
    node({ x: 552, y: 128, w: 170, h: 126, kind: "gold", title: "Trajectory manager", sub: ["generate random", "trajectories", "· send setpoints"], ts: 12, ss: 9, mine: true }),
    arrow("M482,191 L552,191"),
    node({ x: 790, y: 150, w: 120, h: 84, kind: "paper", title: "CSV", sub: ["one file", "per flight"], ts: 12, ss: 9 }),
    arrow("M722,191 L790,191"),
    panel({ x: 34, y: 330, w: 1090, h: 180, label: "Dataset build" }),
    node({ x: 56, y: 374, w: 130, h: 92, kind: "nd", title: "Resample", sub: ["fixed Δt"], ts: 12, ss: 9.5, mine: true }),
    arrow("M850,234 L850,300 L121,300 L121,374", "react"),
    label(470, 292, "raw flights", "edge", 9),
    node({ x: 226, y: 374, w: 190, h: 92, kind: "perc", title: "Statistics", sub: ["mean · covariance · L-Cholesky", "max speed · max distance"], ts: 12, ss: 8.8 }),
    arrow("M186,420 L226,420"),
    node({ x: 456, y: 374, w: 210, h: 92, kind: "cog", title: "Sequence & feature-extract", sub: ["input/output segments", "spline features"], ts: 11.5, ss: 9 }),
    arrow("M416,420 L456,420"),
    node({ x: 706, y: 356, w: 128, h: 58, kind: "hw", title: "Input length", ts: 11.5 }),
    node({ x: 706, y: 428, w: 128, h: 58, kind: "hw", title: "Output length", ts: 11.5 }),
    arrow("M706,385 L666,405", "thin"), arrow("M706,457 L666,437", "thin"),
    node({ x: 894, y: 356, w: 210, h: 58, kind: "gold", title: "Position dataset", ts: 12 }),
    node({ x: 894, y: 428, w: 210, h: 58, kind: "gold", title: "Velocity dataset", ts: 12 }),
    arrow("M834,385 L894,385"), arrow("M834,457 L894,457"),
    label(W / 2, 556, "The statistics pass is not decoration: without the covariance and the speed ceiling you cannot tell a hard trajectory from a corrupt one.", "edge", 11.5),
    label(W / 2, 578, "Input and output length are inputs to the build, not constants — the same flights make different datasets.", "edge", 11.5),
  ].join("\n");
  write("trajectory-dataset.svg", svg({
    w: W, h: H, title: "How the trajectory dataset is made",
    desc: "A dataset-generation pipeline. Gazebo and PX4 fly randomised trajectories commanded through MAVROS by a trajectory manager, and each flight is written to CSV. The build stage resamples each flight to a fixed timestep, computes statistics including mean, covariance, Cholesky factor, maximum speed and maximum distance, then sequences the flights into input and output segments with spline features, producing a position dataset and a velocity dataset.",
    body,
  }));
}

/* ══════════════ 8 · SMART-TRACK ══════════════ */
{
  const W = 1180, H = 700;
  const body = [
    panel({ x: 34, y: 92, w: 250, h: 200, label: "Input" }),
    node({ x: 56, y: 130, w: 206, h: 64, kind: "hw", title: "3D LiDAR", sub: ["raw point cloud"], ts: 12, ss: 9.5 }),
    node({ x: 56, y: 212, w: 206, h: 60, kind: "cog", title: "2D detections", sub: ["bounding boxes"], ts: 12, ss: 9.5 }),
    panel({ x: 316, y: 92, w: 280, h: 200, label: "Point-cloud processing" }),
    node({ x: 338, y: 130, w: 236, h: 64, kind: "perc", title: "Filter", sub: ["CropBox · PassThrough"], ts: 12, ss: 9.5 }),
    node({ x: 338, y: 212, w: 236, h: 60, kind: "perc", title: "Project", sub: ["point (x, y) → pixel"], ts: 12, ss: 9.5 }),
    arrow("M262,162 L338,162"), arrow("M456,194 L456,212"),
    panel({ x: 628, y: 92, w: 250, h: 200, label: "Depth map" }),
    node({ x: 650, y: 130, w: 206, h: 58, kind: "nd", title: "Signed-Z split", sub: ["negative / positive"], ts: 12, ss: 9.5 }),
    node({ x: 650, y: 208, w: 206, h: 64, kind: "nd", title: "Grayscale mapping", sub: ["depth → intensity"], ts: 12, ss: 9.5 }),
    arrow("M574,192 L650,159"), arrow("M753,188 L753,208"),
    panel({ x: 910, y: 92, w: 234, h: 200, label: "Detection fusion" }),
    node({ x: 932, y: 130, w: 190, h: 62, kind: "gold", title: "Selective processing", sub: ["only inside the box"], ts: 11.5, ss: 9.5, mine: true }),
    node({ x: 932, y: 210, w: 190, h: 62, kind: "gold", title: "Position estimate", sub: ["averaged over the patch"], ts: 11.5, ss: 9, mine: true }),
    arrow("M856,192 L932,161"), arrow("M1027,192 L1027,210"),
    // KF loop below
    panel({ x: 28, y: 356, w: 506, h: 250, label: "SMART-TRACK — the part that survives a dropout", solid: true }),
    node({ x: 66, y: 396, w: 200, h: 88, kind: "perc", title: "Kalman filter", sub: ["3D pose + covariance", "keeps predicting through dropouts"], ts: 12.5, ss: 8.8, mine: true }),
    node({ x: 66, y: 508, w: 200, h: 72, kind: "nd", title: "Measurement?", sub: ["is a pose array present"], ts: 12, ss: 9 }),
    arrow("M166,484 L166,508"),
    arrow("M266,544 L330,544"), label(298, 536, "yes", "edge green", 9.5),
    arrow("M66,544 L44,544 L44,440 L66,440", "react"), label(52, 502, "no", "edge", 9.5, "start"),
    node({ x: 330, y: 508, w: 184, h: 72, kind: "gold", title: "Sync KF with the cloud", sub: ["re-anchor on the measurement"], ts: 11.5, ss: 8.8, mine: true }),
    arrow("M1027,272 L1027,330 L422,330 L422,508", "share"),
    label(700, 322, "object position", "edge", 9.5),
    node({ x: 596, y: 400, w: 240, h: 80, kind: "cog", title: "Transform & project", sub: ["world ↔ LiDAR frame", "3D box → centroid"], ts: 12, ss: 9.2 }),
    arrow("M514,440 L596,440"),
    node({ x: 884, y: 380, w: 250, h: 60, kind: "paper", title: "Fused image", ts: 12 }),
    node({ x: 884, y: 452, w: 250, h: 60, kind: "paper", title: "Object pose array", ts: 12 }),
    node({ x: 884, y: 524, w: 250, h: 60, kind: "paper", title: "Segmented object cloud", ts: 12 }),
    arrow("M836,432 L862,432 L862,410 L884,410", "thin"),
    arrow("M862,432 L862,482 L884,482", "thin"),
    arrow("M862,482 L862,554 L884,554", "thin"),
    label(W / 2, 640, "The 2D detector says where to look; the LiDAR says how far. The filter is what keeps the track alive through the frames where the detector says nothing at all.", "edge", 11.5),
    label(W / 2, 662, "Processing only inside the bounding box is the difference between real-time and a slideshow.", "edge", 11.5),
  ].join("\n");
  write("smart-track.svg", svg({
    w: W, h: H, title: "SMART-TRACK",
    desc: "A LiDAR and detection fusion pipeline. Raw 3D LiDAR is filtered with a CropBox and PassThrough filter and projected into 2D pixels, forming a depth map split by signed Z and mapped to grayscale intensity. 2D bounding boxes restrict processing to the detected region, where positions are averaged into an object position estimate. A Kalman filter tracks the 3D pose and covariance and continues to predict when no measurement is present, re-anchoring on the point cloud when one arrives. Outputs are a fused image, an object pose array and a segmented object cloud.",
    body,
  }));
}

/* ══════════════ 9 · Interception state machine ══════════════ */
{
  const W = 1180, H = 560;
  const st = (cx, name, sub) => node({ x: cx - 92, y: 130, w: 184, h: 92, kind: "perc", title: name, sub, ts: 14, ss: 9.5 });
  const cond = (cx, cy, lines) => {
    const r = 62;
    const pts = `${cx},${cy - r} ${cx + r * 1.5},${cy} ${cx},${cy + r} ${cx - r * 1.5},${cy}`;
    let y = cy - (lines.length - 1) * 6.6 + 3;
    return `<polygon points="${pts}" class="nd gold"/>` + lines.map(l => {
      const t = `<text x="${cx}" y="${y.toFixed(1)}" class="sub" font-size="9.2" text-anchor="middle">${esc(l)}</text>`;
      y += 13.1; return t;
    }).join("");
  };
  const X = [150, 430, 730, 1030];
  const body = [
    arrow(`M${X[0] + 92},176 L${X[1] - 92},176`), label((X[0] + X[1]) / 2, 166, "armed 10 s", "edge green", 10),
    arrow(`M${X[1] + 92},176 L${X[2] - 92},176`), label((X[1] + X[2]) / 2, 166, "target detected", "edge green", 10),
    arrow(`M${X[2] + 92},176 L${X[3] - 92},176`), label((X[2] + X[3]) / 2, 166, "within attack range", "edge green", 10),
    // self loops
    arrow(`M${X[1] - 40},130 C${X[1] - 40},76 ${X[1] + 40},76 ${X[1] + 40},130`, "react"), label(X[1], 68, "< 5 min", "edge", 9.5),
    arrow(`M${X[2] - 40},130 C${X[2] - 40},76 ${X[2] + 40},76 ${X[2] + 40},130`, "react"), label(X[2], 68, "keep following", "edge", 9.5),
    arrow(`M${X[3] - 40},130 C${X[3] - 40},76 ${X[3] + 40},76 ${X[3] + 40},130`, "react"), label(X[3], 68, "keep attacking", "edge", 9.5),
    // returns
    arrow(`M${X[1]},222 L${X[1]},262 L${X[0]},262 L${X[0]},222`, "react"), label((X[0] + X[1]) / 2, 276, "> 5 min with no detection", "edge", 9.5),
    arrow(`M${X[2]},222 L${X[2]},296 L${X[1] + 30},296 L${X[1] + 30},222`, "emerg"), label((X[1] + X[2]) / 2, 310, "lost target", "edge gold", 9.5),
    arrow(`M${X[3]},222 L${X[3]},330 L${X[1] - 30},330 L${X[1] - 30},222`, "emerg"), label((X[1] + X[3]) / 2, 344, "target neutralized", "edge gold", 9.5),
    st(X[0], "Idle", ["armed · on ground · v = 0"]),
    st(X[1], "Surveillance", ["airborne, sweeping a pattern"]),
    st(X[2], "Pursuit", ["following a delayed prediction"]),
    st(X[3], "Attack", ["drive the target's velocity to 0"]),
    cond(X[0] + 140, 424, ["the mission starts", "10 s after arming"]),
    cond(X[1] + 150, 424, ["a target enters", "the detection volume"]),
    cond(X[2] + 150, 424, ["the target is", "within attack range"]),
    label(W / 2, 512, "The four states are the easy part. Every arrow that points backwards is the part that decides whether the thing is safe to fly.", "edge", 11.5),
    label(W / 2, 534, "Gold edges are the ones that end an engagement — losing the target and neutralizing it both return to surveillance.", "edge", 11.5),
  ].join("\n");
  write("interception-fsm.svg", svg({
    w: W, h: H, title: "The interception mission, as a state machine",
    desc: "A four-state interception mission. Idle transitions to surveillance ten seconds after arming. Surveillance sweeps a pattern and returns to idle after five minutes with no detection. A detected target moves to pursuit, which follows a delayed prediction of the target. Within attack range the machine enters attack, which drives the target's velocity to zero. Losing the target and neutralizing it both return to surveillance.",
    body,
  }));
}

/* ══════════════ 10 · RL training architecture ══════════════ */
{
  const W = 1160, H = 640;
  const body = [
    node({ x: 40, y: 96, w: 240, h: 82, kind: "gold", title: "Configuration", sub: ["YAML / JSON — one file", "that reproduces the run"], ts: 13, ss: 9.5, mine: true }),
    node({ x: 880, y: 96, w: 240, h: 82, kind: "gold", title: "Action spaces", sub: ["per-agent definitions"], ts: 13, ss: 9.5 }),
    label(580, 122, "environment · hyper-parameters · training · evaluation", "edge", 10.5),
    arrow("M160,178 L160,214 L580,214", "thin"),
    arrow("M1000,178 L1000,214 L580,214", "thin"),
    panel({ x: 40, y: 250, w: 1080, h: 280, label: "Environment (Gymnasium)", solid: true }),
    node({ x: 76, y: 322, w: 200, h: 104, kind: "perc", title: "Agent", sub: ["policy network"], ts: 13, ss: 9.5, mine: true }),
    node({ x: 344, y: 322, w: 210, h: 104, kind: "cog", title: "Algorithm", sub: ["Stable-Baselines3", "or Sample Factory"], ts: 13, ss: 9.5 }),
    node({ x: 622, y: 322, w: 190, h: 104, kind: "perc", title: "Training loop", sub: ["rollouts · updates"], ts: 13, ss: 9.5 }),
    node({ x: 880, y: 300, w: 200, h: 78, kind: "nd", title: "Logging & checkpoints", sub: ["what makes a run repeatable"], ts: 11.5, ss: 8.8, mine: true }),
    node({ x: 880, y: 404, w: 200, h: 74, kind: "paper", title: "Evaluation", sub: ["fresh env instance"], ts: 12.5, ss: 9.2 }),
    arrow("M344,362 L276,362"), label(310, 352, "parameters", "edge", 9),
    arrow("M622,362 L554,362"), label(588, 344, "experience", "edge", 9),
    label(588, 356, "(s, a, r, s′, done)", "edge", 8.6),
    arrow("M812,352 L880,336"), label(846, 328, "metrics", "edge", 9),
    arrow("M980,378 L980,404", "thin"), label(1024, 396, "trained model", "edge", 9, "start"),
    arrow("M176,426 L176,470 L717,470 L717,426", "react"),
    label(446, 484, "the agent instance the loop actually steps", "edge", 9.5),
    arrow("M449,426 L449,452 L880,452", "share"),
    label(680, 444, "model parameters", "edge", 9.5),
    label(W / 2, 574, "Two boxes carry the whole claim to reproducibility: the config that nothing bypasses, and the checkpoint that says which weights produced which number.", "edge", 11.5),
    label(W / 2, 596, "Stable-Baselines3 for simplicity, Sample Factory when throughput is the constraint — the rest of the diagram does not change.", "edge", 11.5),
  ].join("\n");
  write("rl-architecture.svg", svg({
    w: W, h: H, title: "An RL training stack that stays reproducible",
    desc: "A reinforcement-learning training architecture. A configuration file and per-agent action spaces feed a Gymnasium environment. Inside it, an algorithm such as Stable-Baselines3 or Sample Factory passes parameters to the agent's policy network and receives experience tuples from the training loop. Training metrics go to logging and checkpointing, which produces the trained model used by a separate evaluation environment instance.",
    body,
  }));
}

console.log("\n" + (warn.length ? `⚠ ${warn.length} possible overflow(s):\n  ` + warn.join("\n  ") : "no text-overflow warnings"));
