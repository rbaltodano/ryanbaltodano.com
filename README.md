# Personal site

Ryan Baltodano’s portfolio, served by GitHub Pages at https://ryanbaltodano.com/.
The `main` branch deploys automatically. Design and interaction rules are in
[DESIGN.md](DESIGN.md).

## Files

- `index.html`: content, links, native disclosures.
- `css/tokens.css`: typography, spacing, day/night colors.
- `css/base.css`: reset and common elements.
- `css/site.css`: page layout.
- `js/site.js`: theme, year, video playback.
- `js/workspace.js`: optional pinned gallery and its navigation.
- `assets/`: illustrations, real product captures, films, and résumé.

No build is required. Run `python3 -m http.server 8010` to browse locally.
The archived Stageshow source in `stageshow/` is not loaded by the live page.
Its optional build is `npm ci && npm run build`.

Each polaroid loads its bundled Three.js scene as it approaches the page viewport.
The same canvas and curved mesh stay inside the print as it opens and returns;
inspection never replaces it with another rendering.
Its curved geometry, lighting, and materials are in `js/polaroid-3d.js`.
After editing that source, run `npm run build:polaroid` and include the generated
`assets/polaroid-3d.js` in the change. The checked-in bundle keeps Pages deployment
static; WebGL being unavailable leaves the DOM print and rotation controls usable.

## Editing and publishing

Edit content in HTML and shared styles in CSS. Native disclosures work without
JavaScript; the gallery script adds desktop scroll mapping and accessible
navigation. Preserve the existing section/project IDs for direct links.

Bump the numeric `?v=` queries for CSS and JavaScript in `index.html` and
`css/site.css` before pushing. Commit to `main` and push to publish. Verify the
Pages deployment and live content.
