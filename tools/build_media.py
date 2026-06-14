"""Scan the vault Library media collections → media.json + optimized posters.
Reads Movies / Series / Games / Manga frontmatter; downloads each poster to
media/<type>/<slug>.webp. Run:  python tools/build_media.py
"""
import os, re, json, io, urllib.request, hashlib
from PIL import Image

LIB = r"G:\My Drive\Notes\Obsidian\Library"
CATS = {"Movies": "movie", "Series": "series", "Games": "game", "Manga": "manga"}
OUT_JSON = "media.json"
OUT_DIR = "media"

FM = re.compile(r"^---\s*\n(.*?)\n---", re.S)

def parse_fm(text):
    m = FM.match(text)
    if not m: return {}
    d, key = {}, None
    for line in m.group(1).splitlines():
        if re.match(r"^[A-Za-z_]+:", line):
            key, _, val = line.partition(":")
            key = key.strip(); val = val.strip()
            if val and val not in ("[]", '""', "''"):
                d[key] = val.strip('"').strip("'")
            else:
                d[key] = []
        elif line.strip().startswith("- ") and isinstance(d.get(key), list):
            d[key].append(line.strip()[2:].strip().strip('"').strip("'"))
    return d

def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:50] or hashlib.md5(s.encode()).hexdigest()[:8]

def fetch_poster(url, dest):
    if not url or not url.startswith("http"): return False
    if os.path.exists(dest): return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=20).read()
        im = Image.open(io.BytesIO(data)).convert("RGB")
        w = 342
        if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        im.save(dest, "WEBP", quality=80, method=6)
        return True
    except Exception as e:
        print("  poster fail:", url[:60], e)
        return False

def num(v):
    try: return float(v)
    except: return 0.0

def main():
    items = []
    for folder, typ in CATS.items():
        d = os.path.join(LIB, folder)
        if not os.path.isdir(d): continue
        for f in sorted(os.listdir(d)):
            if not f.endswith(".md") or f in ("Movies.md","Series.md","Games.md","Manga.md"): continue
            fm = parse_fm(open(os.path.join(d, f), encoding="utf-8").read())
            title = fm.get("title") or os.path.splitext(f)[0]
            if isinstance(title, list): title = title[0] if title else f
            slug = f"{typ}-{slugify(title)}"
            poster_rel = ""
            if fetch_poster(fm.get("image", ""), os.path.join(OUT_DIR, typ, slug + ".webp")):
                poster_rel = f"{OUT_DIR}/{typ}/{slug}.webp"
            genres = fm.get("genres", [])
            if isinstance(genres, str): genres = [genres]
            items.append({
                "type": typ, "title": title, "year": str(fm.get("year", "")),
                "genres": genres[:3], "rating": num(fm.get("onlineRating", 0)),
                "mine": num(fm.get("personalRating", 0)), "poster": poster_rel,
                "url": fm.get("url", ""),
            })
    # order: by online rating desc within type
    items.sort(key=lambda x: (x["type"], -x["rating"], x["title"]))
    json.dump(items, open(OUT_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    by = {}
    for it in items: by[it["type"]] = by.get(it["type"], 0) + 1
    print("media.json:", len(items), "items", by)

if __name__ == "__main__":
    main()
