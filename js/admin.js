/* ═══════════════════════════════════════════════════════════════════
   admin.js — email-authenticated, owner-only live content editing.

   • Public visitors: the site fetches a content-override blob from Supabase
     and deep-merges it over the static data.js defaults, so saved edits show
     for everyone. If Supabase is unreachable the site silently uses defaults —
     the editing layer never breaks the public page.
   • Owner: open the panel (Ctrl+Shift+E, or the URL hash #admin), sign in with
     your email via a one-time code, then edit ANY content section as JSON with
     a live preview, and Save to the cloud.

   Security rests on Postgres RLS: the anon key is public (fine), but only a
   signed-in session whose email = OWNER can write (see admin-schema.sql).
   ═══════════════════════════════════════════════════════════════════ */

import * as DATA from "./data.js?v=13";

const SB_URL = "https://pvconwkeshzoovchvzqm.supabase.co";
const SB_KEY = "sb_publishable_P2yIjpSw7vCSm8uWhkKixw_ZGbdB7jJ";
const OWNER = "asmalbatati@hotmail.com";
const ROW_ID = "main";
const TABLE = "portfolio_content";

// the editable content model — every object/array export of data.js
const KEYS = ["PROFILE", "STATS", "JOURNEY", "RESEARCH_MAP", "RESEARCH_PLATES",
  "PROJECTS", "PAPERS", "PUBS", "TAXONOMY", "ROBOTS", "PRINTS", "PATENTS",
  "SKILLS", "REPOS", "ORGS", "TEACHING", "QUALS", "WEBWORK", "GALLERY",
  "ARCH", "CALISTHENICS", "I18N"];

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
  ["Home — journey & focus", [
    ["eb_journey", "Journey eyebrow"], ["t_journey", "Journey title"], ["lead_journey", "Journey lead"],
    ["eb_focus", "Focus eyebrow"], ["t_focus", "Focus title"], ["lead_focus", "Focus lead"], ["focus_cta", "Focus button"]]],
  ["Contact", [["eb_contact", "Eyebrow"], ["t_contact", "Title"]]],
  ["Research page", [
    ["rm_kicker", "Map eyebrow"], ["rm_title", "Map title"], ["rm_lead", "Map lead"],
    ["eb_areas", "Areas eyebrow"], ["t_areas", "Areas title"], ["lead_areas", "Areas lead"],
    ["eb_stack", "Model eyebrow"], ["t_stack", "Model title"], ["lead_stack", "Model lead"],
    ["pubdb_title", "Publications eyebrow"], ["t_research", "Publications title"], ["pubdb_lead", "Publications lead"]]],
  ["Projects page", [
    ["projpg_kicker", "Eyebrow"], ["projpg_title", "Title"], ["proj_intro", "Intro"],
    ["eb_patents", "Patents eyebrow"], ["t_patents", "Patents title"],
    ["eb_gallery", "Gallery eyebrow"], ["t_gallery", "Gallery title"], ["gal_flow_hint", "Gallery hint"],
    ["eb_toolkit", "Toolkit eyebrow"], ["t_toolkit", "Toolkit title"],
    ["eb_orgs", "Orgs eyebrow"], ["t_orgs", "Orgs title"], ["orgs_lead", "Orgs lead"],
    ["eb_oss", "Open-source eyebrow"], ["t_oss", "Open-source title"], ["lead_oss", "Open-source lead"],
    ["eb_web", "Web eyebrow"], ["t_web", "Web title"], ["lead_web", "Web lead"]]],
  ["Gallery page", [["hub_kicker", "Eyebrow"], ["hub_title", "Title"], ["hub_sub", "Sub / hint"]]],
  ["Teaching page", [
    ["teach_kicker", "Eyebrow"], ["teach_title", "Title"], ["teach_lead", "Lead"],
    ["teach_courses", "Courses heading"], ["teach_workshops", "Workshops heading"]]],
  ["Qualifications page", [
    ["quals_kicker", "Eyebrow"], ["quals_title", "Title"], ["quals_lead", "Lead"],
    ["q_edu", "Education heading"], ["q_certs", "Certifications heading"],
    ["q_programs", "Programs heading"], ["q_awards", "Awards heading"]]],
  ["Writing page", [["art_eb", "Eyebrow"], ["art_title", "Title"], ["art_lead", "Lead"]]],
  ["Navigation & buttons", [
    ["nav_about", "Nav: About"], ["nav_research", "Nav: Research"], ["nav_projects", "Nav: Projects"],
    ["nav_gallery", "Nav: Gallery"], ["nav_cta", "Nav: contact button"], ["lang_btn", "Language toggle label"]]],
];
const TEXT_OPT = "__TEXT__";
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
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    const { data, error } = await sb.from(TABLE).select("data").eq("id", ROW_ID).abortSignal(ctrl.signal).maybeSingle();
    clearTimeout(t);
    if (error) { console.warn("[admin] content read skipped:", error.message); return; }
    if (data && data.data && Object.keys(data.data).length) { applyOverrides(data.data); rerender?.(); }
  } catch (e) { /* offline / table missing / timeout → keep defaults */ }
}

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

  function toggle(v) { open = v ?? !open; panel.classList.toggle("on", open); if (open) render(); }
  // triggers: Ctrl+Shift+E  ·  #admin hash
  addEventListener("keydown", e => { if (e.ctrlKey && e.shiftKey && (e.key === "E" || e.key === "e")) { e.preventDefault(); toggle(); } });
  if (location.hash === "#admin") setTimeout(() => toggle(true), 300);

  const msg = (m, ok) => { const s = box.querySelector(".admin-msg"); if (s) { s.textContent = m; s.className = "admin-msg" + (ok ? " ok" : m ? " err" : ""); } };

  async function render() {
    sb = await getSb();
    if (!sb) { box.innerHTML = `<p class="admin-note">Cloud unavailable — the editor needs the Supabase client to load (check your connection).</p>`; return; }
    const { data: { session } } = await sb.auth.getSession();
    const email = session?.user?.email || null;
    if (!email) return renderLogin();
    if (email.toLowerCase() !== OWNER.toLowerCase()) return renderDenied(email);
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
          <optgroup label="Advanced — raw JSON">
            ${KEYS.filter(k => edited[k] != null).map(k => `<option${k === curKey ? " selected" : ""}>${k}</option>`).join("")}
          </optgroup>
        </select>
      </label>
      <div class="admin-edit" id="adEdit"></div>
      <div class="admin-actions">
        <button class="admin-btn" id="adPreview">Preview</button>
        <button class="admin-btn accent" id="adSave">Save to cloud</button>
        <button class="admin-btn" id="adRevert" title="Discard local edits, reload saved">Revert</button>
      </div>
      <div class="admin-msg"></div>`;
    const area = box.querySelector("#adEdit");

    // ensure the I18N override buckets exist so text edits have somewhere to land
    function i18n(lang) { edited.I18N = edited.I18N || {}; edited.I18N[lang] = edited.I18N[lang] || {}; return edited.I18N[lang]; }

    function renderArea() {
      if (curKey === TEXT_OPT) return renderText();
      area.innerHTML = `<textarea class="admin-json" id="adJson" spellcheck="false"></textarea>`;
      area.querySelector("#adJson").value = JSON.stringify(edited[curKey], null, 2);
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
      let v; try { v = JSON.parse(area.querySelector("#adJson").value); } catch (e) { msg("Invalid JSON: " + e.message); return false; }
      edited[curKey] = v; applyOne(curKey, v); return true;
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
    box.querySelector("#adRevert").addEventListener("click", async () => {
      const { data } = await sb.from(TABLE).select("data").eq("id", ROW_ID).maybeSingle();
      edited = snapshot();                         // note: defaults; applied overrides already live
      if (data?.data) { applyOverrides(data.data); Object.assign(edited, structuredClone(data.data)); rerender?.(); }
      renderArea(); msg("Reloaded the saved version.", true);
    });
  }
}
