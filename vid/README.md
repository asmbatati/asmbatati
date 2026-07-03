# vid/ — animated hero + emblem (pending Higgsfield credits)

The site already has graceful slots for two short background loops; the `<video>` elements
self-remove while these files are missing, so shipping without them is safe.

| File | Used by | Source still (Higgsfield job id) |
|---|---|---|
| `hero.mp4` | Home hero (over the static illustration) | `ad3a73a8-00f6-4cea-b8d3-0fb7a351c291` — the quadruped-edited hero |
| `emblem.mp4` | Gallery hub emblem (inside the circle) | `16ee78fc-bbdb-4a98-9049-5d6dc263a268` — pending its own quadruped edit first (blocked on credits) |

Generation spec (blocked 3 Jul 2026 — **0 credits, free plan**; top up at higgsfield.ai, then any Claude session can run these):

- Model **`seedance1_5`**, `generate_audio: false`, duration **4 s**, medias `[{value: <job id>, role: "start_image"}]`.
- **hero.mp4** — 16:9, 1080p: "Subtle cinemagraph animation of this engraved illustration: the VTOL's propellers spin slowly, the hexacopters drift gently, the quadruped robot dog trots in place, the rover rocks slightly on the terrain, the robotic arm articulates a few degrees, the 3D printer head moves as it prints the gear, equations shimmer faintly. Locked camera with a very slow push-in. Engraved ink style and cream paper preserved exactly, no people, no new text, seamless gentle loop."
- **emblem.mp4** — 1:1, 720p: "The ornate compass-gear at the center rotates slowly and continuously; in the wedges: the printer nozzle moves, the pendulum swings, the small drone follows the dotted waypoint path, sketch lines draw themselves, the robots shift subtly. Etching style preserved exactly, static camera, seamless loop, no people, no letters."
- Before the emblem video: re-run the emblem quadruped edit (nano_banana_pro i2i on `16ee78fc…`, add a Go2-like robot dog to the robotics wedge only), replace `img/w960|w1600/gallery-hub.webp`, then animate the NEW job id.
- Drop the mp4s here, hard-reload — no code changes needed. Keep each ≤ ~6 MB.
