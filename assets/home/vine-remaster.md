# Remastered vine idle loops — 2026-10-03

Created using the built-in ImageGen tool. Each vine was edited as a transparent 2-by-2 contact sheet of grow frames 21–24 so the frames share detail and style. The generated quadrants were mechanically cropped and packed into horizontal four-frame WebP sheets (quality 95, alpha quality 100). The original grow sheets remain the entrance assets.

- `vine-left-idle-remastered.webp`: 2432 × 627, four 608 × 627 frames.
- `vine-right-idle-remastered.webp`: 2508 × 627, four 627 × 627 frames.
- Original grow frames: 352 × 362 (left), 362 × 362 (right).
- Loop: 4 fps, one second. Reduced motion: final frame, static.

## Prompt set

One edit per side, substituting `left` or `right` in this prompt:

> Use case: precise-object-edit. Edit target: attached transparent 2-by-2 animation contact sheet, containing exactly FOUR frames of the {side} grapevine. Remaster this sprite sheet in high resolution, ideally about 2048 pixels on each side, preserving its exact outer aspect ratio. Enhance real leaf detail, fine veins, serrated contours, delicate golden leaf rims, realistic stem/bark texture, crisp clean alpha edges, and dimensional shadows. Preserve the existing painterly botanical style, olive-green and golden coloring, lighting, exact branch topology and leaf positions in EACH frame, the silhouette, scale, camera, and canvas alignment. The four quadrants are consecutive animation frames: 21 top-left, 22 top-right, 23 bottom-left, 24 bottom-right; preserve their small differences and do NOT turn them into identical copies. All four frames must share consistent leaf textures and identity, only the existing slight motion varies. Each quadrant must occupy exactly half the canvas width and height, with the artwork aligned exactly as in the input, no added gutters or repositioning. Improve only resolution and detail; do not redesign or add foliage. Remove any red/yellow fringe artifacts outside the leaf contours. Actual transparent background and transparent gaps between leaves, no checkerboard painted into image, no backdrop, no labels, no numbers, no border. This is a production website looping animation asset, so precise matching between quadrants is critical.

ImageGen returned 1254 × 1254 sheets. Left quadrants were adjusted horizontally to retain the original vine proportions; right quadrants remain native size.
