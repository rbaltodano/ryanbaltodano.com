# Personal site

Ryan Baltodano's personal site. Separate from the Angrove product site in `../site/` (angrove.app).

- Static HTML/CSS/JS, no build step.
- Own git repo (ignored by the parent `angrove-project` repo), pushed to github.com/rbaltodano/ryanbaltodano.com and served by GitHub Pages at ryanbaltodano.com. The previous portfolio is on the `archive/portfolio-2026-10-25` branch.
- Style: a museum field guide (ivory or night, Newsreader, Courier Prime labels, engraved plates); see `DESIGN.md`.
- Plates: Midjourney engravings with transparent backgrounds in `assets/plates/` (`plate-1` to `plate-5`, plus `vignette-moth`). Night mode inverts them via `--plate-filter`.

Run locally: `python3 -m http.server 8010` from this folder (or the `personal-site` launch config).

Cache busting: GitHub Pages serves assets with a 10-minute cache, so CSS and JS are linked with `?v=<timestamp>`. Bump it on every publish:
`V=$(date +%Y%m%d%H%M); sed -i '' -E "s#\?v=[0-9]+#?v=$V#g" index.html css/site.css`

The parked Stageshow product scenes live in `stageshow/main.tsx`. They use the real app
captures, the vendored Stageshow Stage and Camera, and a separate phone crop.
The rest of the site remains plain HTML/CSS/JS. To rebuild the checked-in assets:

```sh
npm ci
npm run build
```

The current page uses static product captures and does not load the Stageshow
bundle. Those sources remain for future use. Deployment does not need Node.
The reference scenes in `stageshow/gold/` are retained for design comparison,
not loaded on the portfolio. See `stageshow/REHEARSAL.md` for verification.

The live project workspace is plain HTML/CSS with progressive enhancement in
`js/workspace.js`. Add projects and interface notes in `index.html`; screenshot
markers use percentage coordinates so they stay attached to each capture.
Without JavaScript, both projects and all notes remain visible. Each project has its own visible section and direct link. Escape closes the
selected note.
