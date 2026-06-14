# Abdulrahman S. Al-Batati — Portfolio

A cinematic, bilingual (English / العربية) portfolio for a robotics & autonomous-systems researcher.
Buildless static site — open `index.html` or serve the folder; no build step.

## Run locally

```bash
python -m http.server 4176
# then open http://localhost:4176
```

## Highlights

- **Scroll-scrubbed cinematic hero** — a real VTOL takeoff sliced into a canvas frame sequence (GSAP + Lenis).
- **Publications database** — search, filter by research area / type / status / year, sortable, with contribution role, DOI, project page, and copyable BibTeX.
- **Robotics architecture** — an interactive SVG of the author's closed perception↔decision control loop.
- **Projects** — a Three.js spherical gallery of built machines.
- **Beyond career** — calisthenics + a filterable media collection.
- **Bilingual** — full EN/AR with RTL support (toggle in the navbar).

## Stack

Plain HTML + CSS + JS (ES modules). CDN: GSAP 3.12 + ScrollTrigger, Lenis 1.1, Three.js 0.165 (importmap).
Display type: Fraunces · body: Inter · Arabic: Tajawal.

## Structure

```
index.html        — all pages (hash router)
css/main.css       — light warm-green theme
js/data.js         — content (profile, publications, architecture, media, i18n)
js/main.js         — router, renderers, filters
js/cinematic.js    — scroll-scrub engine
js/sphere.js       — Three.js project gallery
img/ frames/ media/ — optimized assets
tools/             — image / media build scripts (Python)
```

## License

All rights reserved. Content, images, and branding © Abdulrahman S. Al-Batati.
