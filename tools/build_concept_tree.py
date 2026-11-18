"""The Concepts gallery's tree, from the Knowledge OS (17 Nov 2026).

Reads the running Knowledge OS (http://localhost:4190, the owner's local site over the
vault) and writes data/concept-tree.json: DISCIPLINES -> branch -> field -> maps -> concepts,
names and structure only. No note text, no mastery, no road state, nothing about the owner's
learning: those stay in the vault. Run from site/:  python tools/build_concept_tree.py
"""
import json, sys, urllib.parse, urllib.request
from datetime import date

API = "http://localhost:4190/api/"
BRANCH_AR = {
    "Foundational Disciplines": "العلوم التأسيسية", "Instrumental Disciplines": "علوم الآلة",
    "Theoretical Disciplines": "العلوم النظرية", "Practical Disciplines": "العلوم العملية",
    "Productive Disciplines": "العلوم الإنتاجية", "Transmitted Disciplines": "العلوم النقلية",
}


def get(path):
    with urllib.request.urlopen(API + path, timeout=120) as r:
        return json.load(r)


def field_tree(name):
    f = get("field?name=" + urllib.parse.quote(name))
    maps = {m["name"]: {"n": m["name"], "c": []} for m in f.get("maps", [])}
    top = []
    for m in f.get("maps", []):                      # maps nest by their parent
        (maps[m["up"]]["c"] if m.get("up") in maps else top).append(maps[m["name"]])
    loose = []
    for c in f.get("concepts", []):                  # a concept hangs from its map, else the field
        node = {"n": c["name"]}
        (maps[c["up"]]["c"] if c.get("up") in maps else loose).append(node)
    def count(n):
        n["k"] = sum(count(x) if "c" in x else 1 for x in n.get("c", []))
        n["c"].sort(key=lambda x: (0 if "c" in x else 1, x["n"].lower()))
        return n["k"]
    root = {"n": f["name"], "ar": f.get("counterpart") or "", "c": top + loose}
    count(root)
    return root


def main():
    tree = get("explore")
    out = {"root": "DISCIPLINES", "root_ar": "فروع المعرفة", "built": date.today().isoformat(), "branches": []}
    for b in tree["branches"]:
        fields = [field_tree(f["name"]) for f in b.get("fields", []) if f.get("concepts", 0) + f.get("claims", 0) > 0]
        out["branches"].append({"n": b["name"], "ar": BRANCH_AR.get(b["name"], ""),
                                "k": sum(f["k"] for f in fields), "c": fields})
    out["k"] = sum(b["k"] for b in out["branches"])
    with open("data/concept-tree.json", "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"concepts {out['k']} across {sum(len(b['c']) for b in out['branches'])} fields")


if __name__ == "__main__":
    sys.exit(main())
