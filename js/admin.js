/* ═══════════════════════════════════════════════════════════════════
   admin.js — email-authenticated, owner-only live content editing.

   • Public visitors: the site fetches a content-override blob from Supabase
     and deep-merges it over the static data.js defaults, so saved edits show
     for everyone. If Supabase is unreachable the site silently uses defaults —
     the editing layer never breaks the public page.
   • Owner: open the panel — click the faint ◆ at the end of the site footer,
     or press Ctrl+Shift+E, or load the URL hash #admin — sign in with your
     email via a one-time code, then edit in one of three modes:
       ✎ Site text  — labelled EN/AR field pairs for the visible copy
       🖼 Media      — upload photos, video and STL/GLB into a chosen gallery
                       slot, WITH the caption that places and explains it
       Advanced     — the raw JSON behind any section

   TWO WAYS TO SAVE, and the difference matters:
     "Save to cloud"      writes the content into Supabase. Live instantly for
                          everyone — but it is an override blob, not the source.
                          A reset/paused project loses it, and while it exists
                          data.js edits are silently ignored. It has bitten twice.
     "Save permanently…"  downloads a bundle. `node tools/bake_content.mjs
                          <bundle>` pulls the uploaded files into the repo,
                          rewrites the URLs to repo paths, writes the content
                          back into data.js and tells you to clear the blob.
                          That is what actually survives.

   Security rests on Postgres RLS: the anon key is public (fine), but only a
   signed-in session whose email = OWNER can write (see admin-schema.sql).
   Uploads go to the `portfolio-media` Storage bucket — public read, owner-only
   write, 60 MB/file. A DEDICATED bucket on purpose: this Supabase project is
   shared by four sites and `photos` already belongs to Maha Lens.
   ═══════════════════════════════════════════════════════════════════ */

import * as DATA from "./data.js?v=32";

const SB_URL = "https://pvconwkeshzoovchvzqm.supabase.co";
const SB_KEY = "sb_publishable_P2yIjpSw7vCSm8uWhkKixw_ZGbdB7jJ";
const OWNER = "asmalbatati@hotmail.com";
const ROW_ID = "main";
const TABLE = "portfolio_content";

// the editable content model — every object/array export of data.js
const KEYS = ["PROFILE", "STATS", "JOURNEY", "RESEARCH_MAP", "RESEARCH_PLATES",
  "PROJECTS", "PAPERS", "PUBS", "TAXONOMY", "ROBOTS", "PRINTS", "PATENTS",
  "SKILLS", "REPOS", "ORGS", "TEACHING", "QUALS", "WEBWORK", "GALLERY",
  "ARCH", "MINDMAPS", "CALISTHENICS", "I18N"];

// The visible site copy — hero, section titles, about, leads — all lives as
// I18N keys (rendered via [data-i18n]). Editing raw JSON to find `hero_l1` is
// unusable, so the "Site text" mode surfaces these as labeled EN/AR fields.
// [key, human label] grouped by where it shows on the site.
const TEXT_GROUPS = [
  ["Hero — home top", [
    ["hero_kicker", "Role / kicker line"], ["hero_l1", "Headline — line 1"],
    ["hero_l2", "Headline — line 2 (accent)"], ["hero_sub", "Subtitle paragraph"],
    ["hero_cta1", "Primary button"], ["hero_cta2", "Secondary button"]]],
  ["About", [
    ["eb_about", "Eyebrow (small label)"], ["t_about", "Section title"],
    ["about_p1", "Paragraph"], ["about_origin", "Origin line"], ["about_meta", "Meta line"]]],
  ["Home — journey & site map", [
    ["eb_journey", "Journey eyebrow"], ["t_journey", "Journey title"], ["lead_journey", "Journey lead"],
    ["sm_eb", "Site-map eyebrow"], ["sm_title", "Site-map title"], ["sm_lead", "Site-map lead"]]],
  ["Contact", [["eb_contact", "Eyebrow"], ["t_contact", "Title"]]],
  // The old "Areas" / "Model" sections are blog posts now — their copy lives in
  // posts/*.md + posts.json, not in I18N, so there is nothing to edit here.
  ["Research page", [
    ["rs_eb", "Highlights eyebrow"], ["rs_title", "Highlights title"],
    ["rm_kicker", "Map eyebrow"], ["rm_title", "Map title"], ["rm_lead", "Map lead"],
    ["pubdb_title", "Publications eyebrow"], ["t_research", "Publications title"], ["pubdb_lead", "Publications lead"]]],
  ["Projects page", [
    ["projpg_kicker", "Eyebrow"], ["projpg_title", "Title"], ["proj_intro", "Intro"],
    ["eb_patents", "Patents eyebrow"], ["t_patents", "Patents title"],
    ["eb_toolkit", "Toolkit eyebrow"], ["t_toolkit", "Toolkit title"],
    ["eb_orgs", "Orgs eyebrow"], ["t_orgs", "Orgs title"], ["orgs_lead", "Orgs lead"]]],
  // Open-source and Web & product are headings INSIDE the Software Pkgs gallery now
  // (16 Aug 2026), which is why they sit under the Gallery page rather than Projects.
  ["Gallery page", [
    ["hub_kicker", "Hub eyebrow"], ["hub_sub", "Hub hint"],
    ["sh_eb", "Emblems eyebrow"], ["sh_title", "Emblems title"], ["sh_lead", "Emblems lead"],
    ["t_oss", "Open-source heading"], ["lead_oss", "Open-source lead"],
    ["t_web", "Web & product heading"], ["lead_web", "Web & product lead"]]],
  ["Teaching page", [
    ["teach_kicker", "Eyebrow"], ["teach_title", "Title"], ["teach_lead", "Lead"],
    ["teach_courses", "Courses heading"], ["teach_workshops", "Workshops heading"]]],
  ["Qualifications page", [
    ["quals_kicker", "Eyebrow"], ["quals_title", "Title"], ["quals_lead", "Lead"],
    ["q_edu", "Education heading"], ["q_certs", "Certifications heading"],
    ["q_programs", "Programs heading"], ["q_awards", "Awards heading"]]],
  ["Blog page", [
    ["art_eb", "Eyebrow"], ["art_title", "Title"], ["art_lead", "Lead"],
    ["mm_eb", "Mind-maps eyebrow"], ["mm_title", "Mind-maps title"], ["mm_lead", "Mind-maps lead"]]],
  ["Navigation & buttons", [
    ["nav_about", "Nav: About"], ["nav_research", "Nav: Research"], ["nav_projects", "Nav: Projects"],
    ["nav_gallery", "Nav: Gallery"], ["nav_cta", "Nav: contact button"], ["lang_btn", "Language toggle label"]]],
];
const TEXT_OPT = "__TEXT__";
const MEDIA_OPT = "__MEDIA__";
const BUCKET = "portfolio-media";

/* Where uploaded media is allowed to land.
   `get(d)` returns the live array for a slot, `make()` builds an entry from the
   uploaded URL plus the captions typed in the form, and `ref`/`label` say which
   field holds the file and what each caption means. Adding a slot here is the only
   change needed to make a new gallery uploadable.

   `accept` is an EXTENSION list, not a MIME list, on purpose: browsers report STL and
   STEP as anything from model/stl to application/octet-stream, so a MIME check would
   reject real CAD files. */
const MEDIA_SLOTS = [
  { id: "robots", key: "ROBOTS", kind: "image", accept: ".webp,.png,.jpg,.jpeg",
    label: "Photos emblem — machines row",
    hint: "The top row of the Selected-photos panel. Caption shows on hover and in the lightbox.",
    get: d => d.ROBOTS, ref: "id", cap: ["cap", "cap_ar"],
    make: (u, en, ar) => ({ id: u, cap: en, cap_ar: ar }) },
  { id: "prints", key: "PRINTS", kind: "image", accept: ".webp,.png,.jpg,.jpeg",
    label: "Photos emblem — prints row",
    hint: "The second row of the Selected-photos panel.",
    get: d => d.PRINTS, ref: "id", cap: ["cap", "cap_ar"],
    make: (u, en, ar) => ({ id: u, cap: en, cap_ar: ar }) },
  { id: "fabphotos", key: "GALLERY", kind: "image", accept: ".webp,.png,.jpg,.jpeg",
    label: "Manufacturing gallery — real prints",
    hint: "The strip under “And in the real world”.",
    get: d => d.GALLERY?.fabrication?.photos, ref: "id", cap: ["cap", "cap_ar"],
    make: (u, en, ar) => ({ id: u, cap: en, cap_ar: ar }) },
  { id: "trophies", key: "GALLERY", kind: "model", accept: ".stl,.glb,.step,.stp",
    label: "Design gallery — the trophy stand (3D)",
    hint: "Spins under the spotlight. STL and GLB render; STEP is stored but CANNOT be displayed — convert it to STL or GLB first.",
    get: d => d.GALLERY?.design?.trophies, ref: "file", cap: ["name", "name_ar"], cap2: ["note", "note_ar"],
    make: (u, en, ar, n, nAr) => ({ file: u, name: en, name_ar: ar, note: n, note_ar: nAr }) },
  { id: "runs", key: "GALLERY", kind: "media", accept: ".mp4,.webm,.webp,.png,.jpg,.jpeg",
    label: "Robotic Simulation gallery — run captures",
    hint: "Video autoplays muted and looped; a still opens in the lightbox instead.",
    get: d => d.GALLERY?.physsim?.runs, ref: "src", cap: ["name", "name_ar"], cap2: ["note", "note_ar"],
    make: (u, en, ar, n, nAr) => ({ id: "run-" + Date.now().toString(36), src: u, name: en, name_ar: ar, note: n, note_ar: nAr }) },
  { id: "mindmaps", key: "MINDMAPS", kind: "image", accept: ".svg,.webp,.png,.jpg,.jpeg",
    label: "Blog — mind-map artwork",
    hint: "Pick the existing row to fill rather than adding one, so the title and blurb are kept.",
    get: d => d.MINDMAPS, ref: "file", cap: ["title", "title_ar"], cap2: ["note", "note_ar"], fillOnly: true,
    make: (u, en, ar, n, nAr) => ({ id: "mm-" + Date.now().toString(36), file: u, w: 1040, h: 640, title: en, title_ar: ar, note: n, note_ar: nAr, tags: [], tags_ar: [] }) },
];
const EXT = n => "." + (n.split(".").pop() || "").toLowerCase();
const slugify = n => n.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "file";
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// supabase-js is loaded lazily from a CDN so a network/CDN failure can NEVER
// break the public site (admin.js is also dynamic-imported from main.js).
let sb = null, sbTried = false;
async function getSb() {
  if (sbTried) return sb;
  sbTried = true;
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.4");
    sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true } });
  } catch (e) { console.warn("[admin] supabase client unavailable", e); }
  return sb;
}

/* ── merge helpers (mutate the imported data objects in place so every render
   that reads them picks up the change without a refactor) ── */
const isObj = v => v && typeof v === "object" && !Array.isArray(v);
function mergeInto(target, src) {
  if (!isObj(target) || !isObj(src)) return;
  for (const k of Object.keys(src)) {
    const s = src[k];
    if (Array.isArray(s)) {
      if (Array.isArray(target[k])) target[k].splice(0, target[k].length, ...s);
      else target[k] = s.slice();
    } else if (isObj(s)) {
      if (!isObj(target[k])) target[k] = {};
      mergeInto(target[k], s);
    } else target[k] = s;
  }
}
function applyOne(key, val) {
  const ref = DATA[key]; if (ref == null || val == null) return;
  if (Array.isArray(ref)) { if (Array.isArray(val)) ref.splice(0, ref.length, ...val); }
  else if (isObj(ref)) mergeInto(ref, val);
}
export function applyOverrides(blob) {
  if (!blob) return;
  for (const k of KEYS) if (k in blob) applyOne(k, blob[k]);
}
// current live content (defaults + any applied overrides), deep-cloned
function snapshot() {
  const out = {};
  for (const k of KEYS) if (DATA[k] != null) out[k] = structuredClone(DATA[k]);
  return out;
}

/* ── load the override blob and apply it, then re-render (best-effort) ── */
export async function initContent(rerender) {
  sb = await getSb(); if (!sb) return;
  let dirty = false;

  // Owner-only UI. Repo links on the "Websites I've built" cards are hidden from
  // visitors (several of those repos are private and would 404 for them); they
  // render only when body.is-owner is set. Failing closed is deliberate — any
  // error here leaves the visitor view.
  try {
    const { data: { session } } = await sb.auth.getSession();
    const email = session?.user?.email || "";
    if (email.toLowerCase() === OWNER.toLowerCase()) { markOwner(); dirty = true; }
  } catch (e) { /* not signed in → visitor view */ }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    const { data, error } = await sb.from(TABLE).select("data").eq("id", ROW_ID).abortSignal(ctrl.signal).maybeSingle();
    clearTimeout(t);
    if (error) console.warn("[admin] content read skipped:", error.message);
    else if (data && data.data && Object.keys(data.data).length) { applyOverrides(data.data); dirty = true; }
  } catch (e) { /* offline / table missing / timeout → keep defaults */ }

  if (dirty) rerender?.();
}

// Exported so the panel can flip the view the moment a sign-in completes,
// without waiting for a reload.
export function markOwner() { document.body.classList.add("is-owner"); }

/* ════════════ admin panel (owner-only editing UI) ════════════ */
export function mountAdmin(rerender) {
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  let edited = null, curKey = TEXT_OPT, open = false;

  const panel = el("div", "admin-panel");
  panel.innerHTML = `
    <div class="admin-box">
      <button class="admin-x" title="Close">✕</button>
      <div class="admin-brand">✎ Content editor</div>
      <div class="admin-body"></div>
    </div>`;
  document.body.append(panel);
  const box = panel.querySelector(".admin-body");
  panel.querySelector(".admin-x").addEventListener("click", () => toggle(false));
  panel.addEventListener("click", e => { if (e.target === panel) toggle(false); });

  function toggle(v) {
    open = v ?? !open; panel.classList.toggle("on", open); if (open) render();
    // Don't leave #admin in the URL after closing: the footer marker is an
    // <a href="#admin">, so a stale hash means the next click fires no
    // hashchange and the marker would look dead.
    if (!open && location.hash === "#admin") history.replaceState(null, "", location.pathname + location.search);
  }
  // triggers: Ctrl+Shift+E  ·  #admin hash  ·  the footer's ◆ marker
  addEventListener("keydown", e => { if (e.ctrlKey && e.shiftKey && (e.key === "E" || e.key === "e")) { e.preventDefault(); toggle(); } });
  if (location.hash === "#admin") setTimeout(() => toggle(true), 300);
  // The footer marker is an <a href="#admin">. The SPA router whitelists its own
  // page hashes and has no hashchange listener, so #admin never routes anywhere —
  // but it also means a click after load only mutates the hash. Catch it here.
  addEventListener("hashchange", () => { if (location.hash === "#admin") toggle(true); });
  // …and wire the marker directly too. The hash alone is not enough: if the hash
  // is already #admin, clicking fires no hashchange and nothing would happen.
  document.querySelectorAll("a.admin-dot").forEach(a =>
    a.addEventListener("click", e => { e.preventDefault(); toggle(true); }));

  const msg = (m, ok) => { const s = box.querySelector(".admin-msg"); if (s) { s.textContent = m; s.className = "admin-msg" + (ok ? " ok" : m ? " err" : ""); } };

  async function render() {
    sb = await getSb();
    if (!sb) { box.innerHTML = `<p class="admin-note">Cloud unavailable — the editor needs the Supabase client to load (check your connection).</p>`; return; }
    const { data: { session } } = await sb.auth.getSession();
    const email = session?.user?.email || null;
    if (!email) return renderLogin();
    if (email.toLowerCase() !== OWNER.toLowerCase()) return renderDenied(email);
    // Signing in mid-session should reveal the owner-only repo links immediately,
    // not on the next reload.
    if (!document.body.classList.contains("is-owner")) { markOwner(); rerender?.(); }
    renderEditor(email);
  }

  function renderLogin() {
    box.innerHTML = `
      <p class="admin-note">Sign in with your email to edit the site. You'll get a one-time code.</p>
      <input class="admin-in" id="adEmail" type="email" placeholder="you@email.com" value="${OWNER}">
      <button class="admin-btn accent" id="adSend">Send code</button>
      <div class="admin-step2" hidden>
        <input class="admin-in" id="adCode" inputmode="numeric" placeholder="6-digit code">
        <button class="admin-btn accent" id="adVerify">Verify &amp; edit</button>
      </div>
      <div class="admin-msg"></div>`;
    box.querySelector("#adSend").addEventListener("click", async () => {
      const em = box.querySelector("#adEmail").value.trim();
      if (!em) return;
      msg("Sending…");
      const { error } = await sb.auth.signInWithOtp({ email: em, options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true } });
      if (error) return msg(error.message);
      box.querySelector(".admin-step2").hidden = false;
      msg("Code sent — check your inbox (or click the link in the email).", true);
    });
    box.querySelector("#adVerify").addEventListener("click", async () => {
      const em = box.querySelector("#adEmail").value.trim(), token = box.querySelector("#adCode").value.trim();
      if (!token) return;
      msg("Verifying…");
      const { error } = await sb.auth.verifyOtp({ email: em, token, type: "email" });
      if (error) return msg(error.message);
      render();
    });
  }

  function renderDenied(email) {
    box.innerHTML = `<p class="admin-note">Signed in as <b>${email}</b> — this account isn't the site owner, so editing is disabled.</p>
      <button class="admin-btn" id="adOut">Sign out</button>`;
    box.querySelector("#adOut").addEventListener("click", async () => { await sb.auth.signOut(); render(); });
  }

  function renderEditor(email) {
    edited = edited || snapshot();
    box.innerHTML = `
      <div class="admin-top"><span class="admin-who">● ${email}</span>
        <button class="admin-btn small" id="adOut">Sign out</button></div>
      <label class="admin-lbl">Section
        <select class="admin-sel" id="adSection">
          <option value="${TEXT_OPT}"${curKey === TEXT_OPT ? " selected" : ""}>✎ Site text — headlines, titles, about</option>
          <option value="${MEDIA_OPT}"${curKey === MEDIA_OPT ? " selected" : ""}>🖼 Media — photos, video, 3D</option>
          <optgroup label="Advanced — raw JSON">
            ${KEYS.filter(k => edited[k] != null).map(k => `<option${k === curKey ? " selected" : ""}>${k}</option>`).join("")}
          </optgroup>
        </select>
      </label>
      <div class="admin-edit" id="adEdit"></div>
      <div class="admin-actions">
        <button class="admin-btn" id="adPreview">Preview</button>
        <button class="admin-btn accent" id="adSave" title="Live for everyone straight away, stored in Supabase">Save to cloud</button>
        <button class="admin-btn gold" id="adExport" title="Download a bundle to bake into data.js — survives a database reset">Save permanently…</button>
        <button class="admin-btn" id="adRevert" title="Discard local edits, reload saved">Revert</button>
      </div>
      <div class="admin-msg"></div>`;
    const area = box.querySelector("#adEdit");

    // ensure the I18N override buckets exist so text edits have somewhere to land
    function i18n(lang) { edited.I18N = edited.I18N || {}; edited.I18N[lang] = edited.I18N[lang] || {}; return edited.I18N[lang]; }

    function renderArea() {
      if (curKey === TEXT_OPT) return renderText();
      if (curKey === MEDIA_OPT) return renderMedia();
      area.innerHTML = `<textarea class="admin-json" id="adJson" spellcheck="false"></textarea>`;
      area.querySelector("#adJson").value = JSON.stringify(edited[curKey], null, 2);
    }

    /* ── media manager ───────────────────────────────────────────────
       Upload → Supabase Storage → the returned public URL is written into the
       chosen slot together with the captions typed here. Captions are required:
       the whole point of this panel is that a file arrives already labelled and
       explained, instead of a bare filename nobody can place later. */
    let slotId = MEDIA_SLOTS[0].id;
    function renderMedia() {
      const slot = MEDIA_SLOTS.find(s => s.id === slotId) || MEDIA_SLOTS[0];
      const list = slot.get(edited) || [];
      const two = !!slot.cap2;
      area.innerHTML = `
        <p class="admin-hint">Pick where it goes, choose the file, then <b>label and explain it</b> — that caption is what places the file on the site. Upload writes it straight into the section; then Save to cloud, or Save permanently.</p>
        <label class="admin-lbl">Goes to
          <select class="admin-sel" id="adSlot">${MEDIA_SLOTS.map(s => `<option value="${s.id}"${s.id === slotId ? " selected" : ""}>${esc(s.label)}</option>`).join("")}</select>
        </label>
        <p class="admin-note small">${esc(slot.hint)}</p>
        ${slot.fillOnly ? `<label class="admin-lbl">Fill an existing entry
          <select class="admin-sel" id="adFill">
            <option value="">— add a new one instead —</option>
            ${list.map((it, i) => `<option value="${i}">${esc(it[slot.cap[0]] || it[slot.ref] || "#" + i)}</option>`).join("")}
          </select></label>` : ""}
        <input class="admin-in" id="adFile" type="file" accept="${slot.accept}">
        <input class="admin-in" id="adCapEn" placeholder="${two ? "Title (English)" : "Caption (English)"} — required">
        <input class="admin-in" id="adCapAr" dir="rtl" placeholder="${two ? "العنوان (بالعربية)" : "الوصف (بالعربية)"}">
        ${two ? `<textarea class="admin-tin wide" id="adNoteEn" rows="2" placeholder="Explain it — what it is, why it matters (English)"></textarea>
                 <textarea class="admin-tin wide" id="adNoteAr" dir="rtl" rows="2" placeholder="اشرحه بالعربية"></textarea>` : ""}
        <button class="admin-btn accent" id="adUp">Upload &amp; place</button>
        <div class="admin-prog" id="adProg" hidden><span></span></div>
        <div class="admin-mlist">
          <div class="admin-mhead">In this section — ${list.length} item${list.length === 1 ? "" : "s"}</div>
          ${list.length ? list.map((it, i) => {
            const v = it[slot.ref] || "";
            const isVid = /\.(mp4|webm)$/i.test(v), isModel = /\.(stl|glb|step|stp)$/i.test(v);
            const thumb = isModel ? `<span class="admin-mthumb model">3D</span>`
              : isVid ? `<span class="admin-mthumb model">▶</span>`
              : `<img class="admin-mthumb" src="${esc(DATA.IMG(v, "w480"))}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'admin-mthumb model',textContent:'?'}))">`;
            return `<div class="admin-mrow" data-i="${i}">${thumb}
              <div class="admin-mmeta"><b>${esc(it[slot.cap[0]] || "(no label)")}</b><span>${esc(String(v).split("/").pop())}</span></div>
              <button class="admin-btn tiny danger" data-del="${i}" title="Remove from the site (the file stays in storage)">✕</button></div>`;
          }).join("") : `<p class="admin-note small">Nothing here yet.</p>`}
        </div>`;

      area.querySelector("#adSlot").addEventListener("change", e => { slotId = e.target.value; renderMedia(); });
      area.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
        const arr = slot.get(edited); if (!arr) return;
        arr.splice(+b.dataset.del, 1);
        applyOne(slot.key, edited[slot.key]); rerender?.(); renderMedia();
        msg("Removed from the page — Save to keep it that way.", true);
      }));
      area.querySelector("#adUp").addEventListener("click", () => upload(slot));
    }

    async function upload(slot) {
      const fileIn = area.querySelector("#adFile"), file = fileIn?.files?.[0];
      const en = area.querySelector("#adCapEn").value.trim();
      const ar = area.querySelector("#adCapAr").value.trim();
      const nEn = area.querySelector("#adNoteEn")?.value.trim() || "";
      const nAr = area.querySelector("#adNoteAr")?.value.trim() || "";
      if (!file) return msg("Choose a file first.");
      if (!en) return msg("The English label is required — it is how this file gets placed and described.");
      if (!slot.accept.split(",").includes(EXT(file.name)))
        return msg(`${EXT(file.name)} is not accepted here. Allowed: ${slot.accept}`);
      if (file.size > 60 * 1024 * 1024) return msg(`That file is ${(file.size / 1048576).toFixed(1)} MB — the limit is 60 MB.`);

      const prog = area.querySelector("#adProg"); prog.hidden = false;
      msg(`Uploading ${file.name} (${(file.size / 1048576).toFixed(1)} MB)…`);
      // Date.now() keeps a re-upload of the same filename from colliding, and the
      // slug keeps the object name readable when it is baked into the repo later.
      const path = `${slot.id}/${Date.now().toString(36)}-${slugify(file.name)}${EXT(file.name)}`;
      const { error } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", upsert: false });
      prog.hidden = true;
      if (error) return msg("Upload failed: " + error.message);
      const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
      const url = pub.publicUrl;

      const arr = slot.get(edited);
      if (!arr) return msg("That section is missing from the content — reload and try again.");
      const fillAt = area.querySelector("#adFill")?.value;
      if (fillAt !== "" && fillAt != null) {
        // fill an existing row: keep its title/blurb, just give it artwork
        const row = arr[+fillAt];
        row[slot.ref] = url;
        if (en) row[slot.cap[0]] = en;
        if (ar) row[slot.cap[1]] = ar;
        if (slot.cap2 && nEn) row[slot.cap2[0]] = nEn;
        if (slot.cap2 && nAr) row[slot.cap2[1]] = nAr;
      } else {
        arr.push(slot.make(url, en, ar, nEn, nAr));
      }
      applyOne(slot.key, edited[slot.key]);
      rerender?.();
      fileIn.value = ""; area.querySelector("#adCapEn").value = ""; area.querySelector("#adCapAr").value = "";
      if (area.querySelector("#adNoteEn")) { area.querySelector("#adNoteEn").value = ""; area.querySelector("#adNoteAr").value = ""; }
      renderMedia();
      msg(/\.(step|stp)$/i.test(url)
        ? "Uploaded ✓ — but STEP cannot be rendered in a browser. It is stored and downloadable; convert it to STL or GLB to make it spin."
        : "Uploaded and placed ✓ — visible on the page now. Save to cloud, or Save permanently.", true);
    }

    function renderText() {
      const en = i18n("en"), ar = i18n("ar");
      area.innerHTML = `<p class="admin-hint">Edit the visible copy directly. English on the left, Arabic on the right. Changes apply on <b>Preview</b>; publish with <b>Save</b>.</p>`
        + TEXT_GROUPS.map(([group, rows], gi) => {
          const cells = rows.filter(([k]) => k in en || k in ar).map(([k, label]) => {
            const long = ((en[k] || "").length > 48) || ((ar[k] || "").length > 48);
            return `<div class="admin-trow">
              <div class="admin-tlabel">${label}</div>
              <textarea class="admin-tin" data-k="${k}" data-l="en" rows="${long ? 3 : 1}" placeholder="English">${esc(en[k])}</textarea>
              <textarea class="admin-tin" data-k="${k}" data-l="ar" dir="rtl" rows="${long ? 3 : 1}" placeholder="العربية">${esc(ar[k])}</textarea>
            </div>`;
          }).join("");
          return `<details class="admin-tgroup"${gi === 0 ? " open" : ""}><summary>${group}</summary>${cells}</details>`;
        }).join("");
      // write into edited.I18N as the owner types; live-preview on blur (change)
      area.querySelectorAll(".admin-tin").forEach(t => {
        t.addEventListener("input", e => { i18n(e.target.dataset.l)[e.target.dataset.k] = e.target.value; });
        t.addEventListener("change", () => { applyOne("I18N", edited.I18N); rerender?.(); });
      });
    }

    renderArea();
    box.querySelector("#adSection").addEventListener("change", e => { curKey = e.target.value; renderArea(); });
    box.querySelector("#adOut").addEventListener("click", async () => { await sb.auth.signOut(); edited = null; render(); });

    // read the current edit into `edited`; returns false on invalid JSON
    function commit() {
      if (curKey === TEXT_OPT) { applyOne("I18N", edited.I18N); return true; }
      if (curKey === MEDIA_OPT) return true;    // uploads write into `edited` as they land
      let v; try { v = JSON.parse(area.querySelector("#adJson").value); } catch (e) { msg("Invalid JSON: " + e.message); return false; }
      edited[curKey] = v; applyOne(curKey, v); return true;
    }

    // Every uploaded file referenced anywhere in the content, so the bake tool knows
    // what to pull into the repo.
    function collectMedia(root) {
      const out = new Set();
      (function walk(v) {
        if (typeof v === "string") { if (v.includes(`/${BUCKET}/`)) out.add(v); return; }
        if (Array.isArray(v)) return v.forEach(walk);
        if (v && typeof v === "object") return Object.values(v).forEach(walk);
      })(root);
      return [...out];
    }

    box.querySelector("#adPreview").addEventListener("click", () => {
      if (!commit()) return;
      rerender?.(); msg("Previewed on the page (not saved yet).", true);
    });
    box.querySelector("#adSave").addEventListener("click", async () => {
      if (!commit()) return;
      rerender?.(); msg("Saving…");
      const { error } = await sb.from(TABLE).upsert({ id: ROW_ID, data: edited, updated_at: new Date().toISOString() }).select();
      if (error) return msg("Save failed: " + error.message);
      msg("Saved — live for everyone ✓", true);
    });
    /* "Save permanently" — a static site cannot write its own source, so this
       downloads a bundle instead: the full content plus a list of every uploaded
       file. `node tools/bake_content.mjs <bundle>` then pulls the media into the
       repo, rewrites the URLs to repo-relative paths, merges the text into data.js
       and clears the cloud blob. That is what makes it survive a database reset —
       which "Save to cloud" alone does not. */
    box.querySelector("#adExport").addEventListener("click", () => {
      if (!commit()) return;
      const media = collectMedia(edited);
      const bundle = { kind: "portfolio-content-bundle", version: 1, exported: new Date().toISOString(), owner: email, media, data: edited };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
      a.download = `portfolio-content-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      msg(`Bundle downloaded — ${media.length} uploaded file(s) referenced. Bake it in with: node tools/bake_content.mjs <that file>`, true);
    });
    box.querySelector("#adRevert").addEventListener("click", async () => {
      const { data } = await sb.from(TABLE).select("data").eq("id", ROW_ID).maybeSingle();
      edited = snapshot();                         // note: defaults; applied overrides already live
      if (data?.data) { applyOverrides(data.data); Object.assign(edited, structuredClone(data.data)); rerender?.(); }
      renderArea(); msg("Reloaded the saved version.", true);
    });
  }
}
