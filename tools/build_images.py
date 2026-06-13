"""Curate + optimize portfolio media into responsive WebP.
Reads from the vault media-drop, writes img/{w480,w960,w1600}/<slug>.webp.
Run from repo root:  python tools/build_images.py
"""
from PIL import Image, ImageOps
import os, pathlib

SRC_BASE = r"G:\My Drive\Notes\Obsidian\Areas\Portfolio\Websites\1-portfolio-abdulrahman\media-drop"
OUT = "img"

# slug -> source path (relative to SRC_BASE)
MANIFEST = {
    # hero + portrait
    "hero-vtol":        r"photos\DSC00893.JPG",
    "portrait":         r"headshot\DSC01599.jpg",
    # project sphere (CAD renders + real flagship builds)
    "proj-taer":        r"cad\TAER\Untitled Project (5).jpg",
    "proj-agridrone":   r"cad\AgriDrone\afri.jpg",
    "proj-roboeye":     r"cad\RoboEye\Visual-Inerial Kit 1.png",
    "proj-faseeh":      r"cad\FASEEH\Untitled.png",
    "proj-amir":        r"cad\AMIR\AMIR (6).jpg",
    "proj-robohotel":   r"cad\RoboHotel\AMIR (10).jpg",
    "proj-surveil":     r"photos\DSC00550.JPG",
    "proj-vtol-build":  r"robots\IMG-20230606-WA0001.jpg",
    # robots gallery (real, screened)
    "rob-quad-gym":     r"robots\IMG-20240603-WA0003.jpg",
    "rob-ugv-proto":    r"robots\IMG-20210810-WA0029.jpg",
    "rob-psu-hexa":     r"robots\IMG20220522084925.jpg",
    "rob-gimbal":       r"photos\IMG_2335.JPG",
    "rob-bench":        r"robots\IMG20230527100830.jpg",
    "rob-quad-elec":    r"robots\IMG-20230615-WA0006.jpg",
    # 3d-prints gallery (screened, no people)
    "print-stereo":     r"3d-prints\RoboEye\IMG20240328111230.jpg",
    "print-kacst-1":    r"3d-prints\DSC_0079.JPG",
    "print-kacst-2":    r"3d-prints\DSC_0108.JPG",
    # credentials / patents
    "patent-transfer":  r"awards\patents\image.png",
    "patent-vtol":      r"3d-prints\IMG-20230207-WA0011.jpg",
}

WIDTHS = [("w480", 480), ("w960", 960), ("w1600", 1600)]


def main():
    missing = []
    for slug, rel in MANIFEST.items():
        src = os.path.join(SRC_BASE, rel)
        if not os.path.exists(src):
            missing.append((slug, rel))
            continue
        im = Image.open(src)
        im = ImageOps.exif_transpose(im).convert("RGB")
        for label, w in WIDTHS:
            tgt = im if im.width <= w else im.resize(
                (w, max(1, round(im.height * w / im.width))), Image.LANCZOS)
            d = os.path.join(OUT, label)
            os.makedirs(d, exist_ok=True)
            tgt.save(os.path.join(d, f"{slug}.webp"), "WEBP", quality=82, method=6)
        print(f"ok  {slug:18s} {im.width}x{im.height}")
    if missing:
        print("\nMISSING:")
        for slug, rel in missing:
            print(f"  {slug}: {rel}")
    tot = sum(os.path.getsize(os.path.join(r, f))
              for r, _, fs in os.walk(OUT) for f in fs)
    n = sum(len(fs) for _, _, fs in os.walk(OUT))
    print(f"\nTOTAL img/: {tot // 1024} KB across {n} files")


if __name__ == "__main__":
    main()
