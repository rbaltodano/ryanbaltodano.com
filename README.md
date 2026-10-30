# Personal site

Ryan Baltodano's personal site. Separate from the Angrove product site in `../site/` (angrove.app).

- Static HTML/CSS/JS, no build step.
- Own git repo (ignored by the parent `angrove-project` repo), pushed to github.com/rbaltodano/ryanbaltodano.com and served by GitHub Pages at ryanbaltodano.com. The previous portfolio is on the `archive/portfolio-2026-10-25` branch.
- Style: the inVectus Instrument theme (near-black, Inter, Martian Mono labels); see `DESIGN.md`. Held to the Hallmark gates (sloplint).

Run locally: `python3 -m http.server 8010` from this folder (or the `personal-site` launch config).

Cache busting: GitHub Pages serves assets with a 10-minute cache, so CSS and JS are linked with `?v=<timestamp>`. Bump it on every publish:
`V=$(date +%Y%m%d%H%M); sed -i '' -E "s#\?v=[0-9]+#?v=$V#g" index.html css/site.css`
