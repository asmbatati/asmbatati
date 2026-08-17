/* Bake an admin "Save permanently…" bundle into the repo.
 *
 *   node tools/bake_content.mjs ~/Downloads/portfolio-content-2026-08-17.json
 *   node tools/bake_content.mjs <bundle> --dry        # report only, write nothing
 *
 * Why this exists: "Save to cloud" writes the content into Supabase, and admin.js
 * merges that blob over data.js at runtime. That is live immediately but it is NOT
 * permanent — a schema reset, a paused project or a cleared row takes it with it, and
 * (worse) the file stops being the source of truth, so a later edit to data.js does
 * nothing. It has bitten twice. This tool closes the loop:
 *
 *   1 · downloads every uploaded file out of Supabase Storage into the repo
 *   2 · rewrites those URLs to repo-relative paths
 *   3 · writes the whole content back into js/data.js as the real default
 *   4 · tells you to clear the cloud blob, so data.js is authoritative again
 *
 * It only rewrites exports it can find and parse. Anything it cannot place is
 * reported rather than guessed at.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, "..");
const DATA = path.join(SITE, "js", "data.js");

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const bundlePath = args.find(a => !a.startsWith("--"));
if (!bundlePath) {
  console.error("usage: node tools/bake_content.mjs <bundle.json> [--dry]");
  process.exit(1);
}

const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
if (bundle.kind !== "portfolio-content-bundle") {
  console.error(`✗ ${bundlePath} is not an admin bundle (kind: ${bundle.kind ?? "missing"}).`);
  process.exit(1);
}
console.log(`bundle exported ${bundle.exported} by ${bundle.owner}`);
console.log(`${(bundle.media || []).length} uploaded file(s), ${Object.keys(bundle.data || {}).length} content key(s)\n`);

/* ── 1 · pull the media into the repo ──
   Destination follows the slot the file was uploaded under, which is the first
   path segment of the storage object name. */
const DEST = {
  robots: "img/w960", prints: "img/w960", fabphotos: "img/w960",
  runs: "img/sim", mindmaps: "img/mindmaps",
  trophies: null,   // decided per extension below
};
const trophyDest = f => (/\.glb$/i.test(f) ? "assets/models" : "assets/stl");

const rewrite = new Map();      // storage URL → repo-relative path
const skipped = [];

for (const url of bundle.media || []) {
  const m = url.match(/\/portfolio-media\/(.+)$/);
  if (!m) { skipped.push([url, "not a portfolio-media URL"]); continue; }
  const objectName = decodeURIComponent(m[1].split("?")[0]);
  const [slot, ...rest] = objectName.split("/");
  const file = rest.join("/") || objectName;
  const dir = slot === "trophies" ? trophyDest(file) : DEST[slot];
  if (!dir) { skipped.push([url, `no destination mapped for slot "${slot}"`]); continue; }

  const relDir = dir, absDir = path.join(SITE, relDir);
  const rel = `${relDir}/${path.basename(file)}`;
  const abs = path.join(SITE, rel);

  if (fs.existsSync(abs)) {
    console.log(`  = ${rel} (already present)`);
    rewrite.set(url, rel);
    continue;
  }
  if (DRY) { console.log(`  + ${rel}  ← ${url}`); rewrite.set(url, rel); continue; }

  const res = await fetch(url);
  if (!res.ok) { skipped.push([url, `HTTP ${res.status}`]); continue; }
  fs.mkdirSync(absDir, { recursive: true });
  fs.writeFileSync(abs, Buffer.from(await res.arrayBuffer()));
  const kb = (fs.statSync(abs).size / 1024).toFixed(0);
  console.log(`  + ${rel}  (${kb} KB)`);
  rewrite.set(url, rel);
}

/* ── 2 · rewrite the URLs inside the content ── */
const swap = v => {
  if (typeof v === "string") return rewrite.get(v) ?? v;
  if (Array.isArray(v)) return v.map(swap);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]));
  return v;
};
const content = swap(bundle.data || {});

/* ── 3 · write it back into data.js ──
   Each key is a top-level `export const NAME = …;`. The body is replaced by
   matching from the opening brace/bracket to the balanced close, so nested
   braces inside strings do not throw the scan off. */
const src0 = fs.readFileSync(DATA, "utf8");
let src = src0;
const done = [], missing = [];

function bodyRange(text, startIdx) {
  const open = text[startIdx], close = open === "{" ? "}" : "]";
  let depth = 0, inStr = null, esc = false;
  for (let i = startIdx; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (!depth) return i + 1; }
  }
  return -1;
}

for (const [key, value] of Object.entries(content)) {
  if (value == null || typeof value !== "object") { missing.push([key, "not an object/array"]); continue; }
  const decl = new RegExp(`export const ${key}\\s*=\\s*`);
  const m = decl.exec(src);
  if (!m) { missing.push([key, "no `export const` in data.js"]); continue; }
  const bodyStart = m.index + m[0].length;
  if (!"{[".includes(src[bodyStart])) { missing.push([key, "body is not an object/array literal"]); continue; }
  const bodyEnd = bodyRange(src, bodyStart);
  if (bodyEnd < 0) { missing.push([key, "unbalanced literal"]); continue; }
  src = src.slice(0, bodyStart) + JSON.stringify(value, null, 2) + src.slice(bodyEnd);
  done.push(key);
}

console.log(`\nbaked: ${done.join(", ") || "(nothing)"}`);
if (missing.length) { console.log("NOT baked:"); missing.forEach(([k, why]) => console.log(`  ! ${k} — ${why}`)); }
if (skipped.length) { console.log("media skipped:"); skipped.forEach(([u, why]) => console.log(`  ! ${why}: ${u}`)); }

if (DRY) { console.log("\n--dry: nothing written."); process.exit(0); }

// A syntax check before overwriting: a broken data.js takes the whole site down.
const tmp = path.join(SITE, "js", ".data.baked.mjs");
fs.writeFileSync(tmp, src, "utf8");
try {
  await import(`file://${tmp.replace(/\\/g, "/")}?t=${Date.now()}`);
} catch (e) {
  fs.unlinkSync(tmp);
  console.error("\n✗ the baked data.js does not parse — nothing was written.\n  " + e.message);
  process.exit(1);
}
fs.unlinkSync(tmp);

fs.copyFileSync(DATA, DATA + ".bak");
fs.writeFileSync(DATA, src, "utf8");
console.log(`\n✓ js/data.js rewritten (previous version at js/data.js.bak)`);
console.log(`  ${rewrite.size} media reference(s) now point into the repo.`);
console.log(`\nNEXT — otherwise the cloud blob keeps overriding the file you just wrote:`);
console.log(`  1. bump the ?v= query in index.html + js/*.js`);
console.log(`  2. clear the override row so data.js is authoritative:`);
console.log(`       update portfolio_content set data = '{}'::jsonb where id = 'main';`);
console.log(`     (back it up first: insert … select 'backup-<date>', data from portfolio_content where id='main')`);
console.log(`  3. review the diff, then commit`);
