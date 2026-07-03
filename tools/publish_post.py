"""Publish a markdown note (e.g. straight from the Obsidian vault) to the blog.

    python tools/publish_post.py "G:\\My Drive\\Notes\\Obsidian\\Atlas\\Some Note.md"
    python tools/publish_post.py note.md --title "Better title" --tags "ROS 2,writing" --cover img/w960/proj-roboeye.webp

What it does:
  1. strips Obsidian YAML frontmatter + the vault nav header (AR|EN line, HOME, ~ UP lines)
  2. converts [[wikilinks|alias]] -> alias, [[wikilinks]] -> text, drops ![[embeds]]
  3. derives title / date / tags / language / excerpt / read time
  4. writes posts/<slug>.md and registers the post in posts/posts.json

Re-publishing the same note (same slug) updates it in place.
"""
import argparse, json, re, sys, datetime
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
POSTS = SITE / "posts"
INDEX = POSTS / "posts.json"

def slugify(s):
    s = re.sub(r"[^\w\s-]", "", s, flags=re.UNICODE).strip().lower()
    return re.sub(r"[\s_]+", "-", s)[:70] or "post"

def parse_frontmatter(text):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    if not m: return {}, text
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line and not line.startswith((" ", "-", "\t")):
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm, text[m.end():]

def iso_from_vault(created):
    """'15 May 2026 (14:30)' -> '2026-05-15'; anything else -> ''."""
    m = re.match(r"^(\d{1,2}) (\w{3,}) (\d{4})", (created or "").strip())
    if not m: return ""
    months = {n: i for i, n in enumerate(
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], 1)}
    mm = months.get(m.group(2)[:3].title())
    return f"{m.group(3)}-{mm:02d}-{int(m.group(1)):02d}" if mm else ""

def clean_body(body):
    lines, out, started = body.splitlines(), [], False
    for ln in lines:
        s = ln.strip()
        # drop the vault nav header block before real content starts
        if not started and (s.startswith("🏡") or s.startswith("~ ") or re.match(r"^\[\[.*\|(AR|EN)\]\]", s) or s == ""):
            continue
        started = True
        out.append(ln)
    body = "\n".join(out)
    dropped = len(re.findall(r"!\[\[[^\]]+\]\]", body))
    body = re.sub(r"!\[\[[^\]]+\]\]", "", body)                    # embeds can't resolve outside the vault
    body = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", body)     # [[target|alias]] -> alias
    body = re.sub(r"\[\[([^\]]+)\]\]", r"\1", body)                # [[target]] -> target
    body = re.sub(r"\n{3,}", "\n\n", body).strip() + "\n"
    return body, dropped

def main():
    ap = argparse.ArgumentParser(description="Publish a markdown note to the blog")
    ap.add_argument("src", help="path to the source .md")
    ap.add_argument("--title"); ap.add_argument("--title-ar", dest="title_ar")
    ap.add_argument("--date"); ap.add_argument("--tags", default="")
    ap.add_argument("--cover", default=""); ap.add_argument("--excerpt", default="")
    ap.add_argument("--lang", choices=["en", "ar"]); ap.add_argument("--slug")
    a = ap.parse_args()

    src = Path(a.src)
    if not src.exists(): sys.exit(f"not found: {src}")
    fm, body = parse_frontmatter(src.read_text(encoding="utf-8"))
    body, dropped = clean_body(body)

    # title: flag > frontmatter > first H1 > filename
    m = re.match(r"^#\s+(.+)\n", body)
    title = a.title or fm.get("title") or (m.group(1).strip() if m else src.stem)
    if m and m.group(1).strip() == title:
        body = body[m.end():].lstrip("\n")                          # reader renders the H1 itself

    arabic = len(re.findall(r"[؀-ۿ]", body))
    lang = a.lang or ("ar" if arabic > len(body) * 0.15 else "en")
    words = len(re.findall(r"\S+", body))
    read = max(1, round(words / (180 if lang == "ar" else 200)))
    date = a.date or iso_from_vault(fm.get("created")) or datetime.date.today().isoformat()
    tags = [t.strip() for t in a.tags.split(",") if t.strip()] or \
           [t.strip() for t in re.split(r"[,\s]+", fm.get("tags", "")) if t.strip() and t.strip() != "[]"]
    first_para = next((p.strip() for p in body.split("\n\n") if p.strip() and not p.strip().startswith("#")), "")
    excerpt = a.excerpt or re.sub(r"\s+", " ", first_para)[:200]
    slug = a.slug or slugify(title)

    POSTS.mkdir(exist_ok=True)
    (POSTS / f"{slug}.md").write_text(body, encoding="utf-8")

    index = json.loads(INDEX.read_text(encoding="utf-8")) if INDEX.exists() else []
    entry = {"slug": slug, "file": f"{slug}.md", "title": title, "date": date, "read": read,
             "lang": lang, "tags": tags, "cover": a.cover, "excerpt": excerpt}
    if a.title_ar: entry["title_ar"] = a.title_ar
    index = [p for p in index if p.get("slug") != slug] + [entry]
    index.sort(key=lambda p: p.get("date", ""), reverse=True)
    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"published: posts/{slug}.md  ({lang}, {words} words, ~{read} min)")
    if dropped: print(f"  note: {dropped} vault embed(s) ![[...]] dropped — add images manually if needed")
    print(f"  index: {len(index)} post(s) in posts/posts.json")

if __name__ == "__main__":
    main()
