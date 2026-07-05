# vid/ — animated hero + emblem loops

Both loops are **generated and shipped** (3 Jul 2026). The `<video>` elements in
`index.html` / `js/gallery.js` play these over the static illustrations and
self-remove if a file is ever missing, so the site degrades gracefully.

| File | Used by | Source still (Higgsfield job) | Encoded |
|---|---|---|---|
| `hero.mp4` | Home hero | `ad3a73a8-…` (Go2 hero) → video `96eccffb-…` | H.264 1280w, CRF 30, no audio, faststart (~790 KB) |
| `emblem.mp4` | Gallery hub emblem | `b6f853d8-…` (Go2 emblem) → video `0acc835f-…` | H.264 720w, CRF 30, no audio, faststart (~710 KB) |

Both are **text-prompt-only** subtle cinemagraphs of the engraved illustrations —
no people, no personal media (pre-publish gate screened every frame: people-free).

## To regenerate (any session with Higgsfield credits)

- Model **`seedance1_5`**, `generate_audio: false`, duration **4 s**, `medias: [{value: <image job id>, role: "start_image"}]`. Add `declined_preset_id` if it suggests a preset — we want the literal subtle animation.
- **hero** — 16:9, 1080p; prompt: gentle prop-spin / quadruped step / rover rock / arm articulate / printer glide, locked camera, engraved style preserved, seamless loop.
- **emblem** — 1:1, 720p; prompt: central compass-gear rotates slowly, wedge details come alive quietly, static camera, seamless loop.
- Compress before shipping (system has no ffmpeg on PATH — use `imageio_ffmpeg.get_ffmpeg_exe()`): `-vf scale=<w>:-2 -c:v libx264 -crf 30 -preset slow -an -movflags +faststart`. Keep each ≤ ~1 MB.
- Drop the mp4 here, hard-reload — no code changes needed.
