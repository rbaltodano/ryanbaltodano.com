# DESIGN.md: Personal site

The locked system for `personal-site/`. Since 2026-10-25 every build is also held to the **Hallmark** anti-slop gates (github.com/Nutlope/hallmark, v2.0.0). The stamp at the top of `css/site.css` records the run.

**Brand:** a personal site for Ryan Baltodano only. Don't mention Sine Viridian, which isn't public yet.
**Direction (since 2026-10-30):** the inVectus Instrument theme (`~/Developer/inVectus/src/App.css`): near-black ground, Inter Light headings with a dim second phrase, Martian Mono only for tracked uppercase labels and numbers, hairlines instead of boxes, and mint as the one signal. Thin line diagrams (inVectus `LineArt`) replace the polygons.
**Job:** hire. Contact sits in the nav, once in the hero, and again at the close.

---

## 1. Principles

1. **Reserved and scholarly.** Cream paper, dark-brown serif heads and quiet sans body text, like a well-set journal. Olive is a signal (links, italic emphasis, accent shapes) and covers under 5% of any screen.
2. **One idea per screen.** About 80 words or fewer per 900px screen. Each section is one piece of real content shown large.
3. **Shapes as accents, never backgrounds.** Only plain polygons (triangle, square, pentagon, hexagon, heptagon), small, on a card corner or beside a row title. No lattices, nesting, spirals or fractals. They come from one inline SVG sprite with no script.
4. **Show the real thing.** Project sections use real captures of the product. Missing facts are left out, never invented.

## 2. Colour: shared with inVectus

Source of truth: Figma "ESB Stuff 3", node 1227:166. inVectus (`src/App.css`) uses the same values.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#141414` | Page |
| `--surface` | `#202020` | Cards and the index band |
| `--surface-2` | `#292929` | Row hover, selected tab |
| `--ink` | `#d1cbc2` | Headings, body and links |
| `--dim` | `rgba(209, 203, 194, 0.5)` | Muted text, the second phrase in heads, labels |
| `--mint` | `#6edcaa` | The one signal: focus, the lead work code, the status dot, one accent diagram. Under 2% of any screen. |

- Rules are `#333333`; stronger rules (buttons, pills) are `#48453f`.
- Colour literals only ever appear in `css/tokens.css`.

## 3. Type

- **Inter** for display and body. Headings at weight 300, tracked −0.025em (−0.05em on the name). Body 16px, line height 1.6.
- **Emphasis:** one phrase per head in `--dim`, upright (no italics).
- **Martian Mono** only for small tracked uppercase labels: section codes (`01 Work`), captions, dates, the footer, the status pill.
- **Copy:** no em or en dashes. Section heads are six words or fewer.

## 4. Layout

- `.container` is capped at 1440px with 64px gutters (24px under 60rem, 16px under 40rem), on a 12-column grid with a 32px gap.
- Gaps between sections vary: 120, 144 or 176px. Seams use whitespace, one canvasSecondary band, and a hairline.
- **Cards:** `--surface` with a 1px hairline and a 2px radius, no shadow. They hold the capabilities, the practice shapes and the contact block. Never a card inside a card.
- **Chrome:** the nav is one edge-aligned line (the name, then Work, Practice, Capabilities and Contact; under 40rem only Contact shows). The footer is a one-line colophon.

## 5. The page

| Section | Composition | Content |
|---|---|---|
| Hero | Banner | The name, one sentence, "See the work" and "Email me". No background. |
| Work | Showcase | "Angrove, a private study app". One wide Mac capture, then a pair below at 8 and 4 columns. |
| Index | Rows on the dark band (`#24201C`) | "Selected work, 2024 to now". Five real items, each with a small olive polygon before its title (three to seven sides, in order). |
| Practice | Steps beside a pinned figure | "One person, design to code". Desktop, like xAI's Grok page: four steps (Interface, Code, Test, Ship) scroll on the left, and the figure on the right stays pinned and redraws for the step crossing mid-screen. Under 60rem nothing pins: each step has its own figure under its text, drawn once as it scrolls in. Keep both; the owner wants the pinned version on desktop. |
| Capabilities | Bento of 4 cards (7 and 5 over 5 and 7) | Design, Front end, Apps and Systems. Each card has one shape in its top-right corner (triangle, square, hexagon, pentagon) and its text at the bottom. |
| Close | Split, 6 and 6 | The greyscale photo, beside a contact card with a small triangle: "Write to me", "Open for collaborations.", the email address, GitHub, the résumé and the case study. |
| Footer | Colophon | Name and year, and "Back to top". |

## 6. Line drawings

- Inline SVGs in a 100×100 box, each stroke a `<path pathLength="1">`, drawn in `currentColor` at white 35%. Strokes use viewBox units (1.6 to 1.9), not `non-scaling-stroke`, so the draw-in dashes stay exact.
- They show the thing named: capabilities have a vector curve with handles (Design), a browser with `</>` (Front end), a phone with an app grid (Apps) and a database (Systems). Practice has interface, terminal, check and paper plane (mint). Contact has an envelope.
- Work rows use mono codes (`01` to `06`); the lead row's code is mint.

## 7. Motion

- **Draw-in:** each line drawing traces stroke by stroke (900ms each, 110ms apart) once it is 12% up the screen, then stays.
- **Footer name:** "Baltodano" spans the content width in Inter Light, fading to nothing toward the bottom, after angrove.app's footer. It rises in from a blur on first sight.
- **Practice figure** (`js/practice.js`): labelled hairline diagrams on canvas, after True Anomaly's orbit diagram: thin ink lines, dashed construction guides, one mint accent, and small Martian Mono labels on leader lines that name the real thing (Type scale, Component, Pattern; SwiftUI, React, Rust; 80 cases, Default; TestFlight, Mac, Dec 15). Lines trace in over 2s, then labels fade up. Reduced motion shows the finished diagram.
- All are skipped under reduced motion and without JavaScript. Hovers change colour only; the button moves 1px on `:active`.

## 8. Hallmark checks

```bash
node ~/.claude/skills/hallmark/scripts/sloplint.mjs index.html --genre editorial --kept
```

- **Last result:** 4 FAIL, all on gate 38i: the deliberate italic phrases in the four section heads. There are 0 other failures or warnings, and 38ii is waived.
- **Not yet run:** the render tier needs `puppeteer-core`. Layout was checked by hand at 1440×900 and 375px.


## Stageshow revision, 2026-11-01

This revision supersedes the old hero and capability card composition above.
The neutral inVectus palette, type, contact links, and pinned desktop Practice
section remain. The hero leads with “Thoughtfully designed. Personally built.”,
with Ryan named in its introduction and navigation. A small grayscale portrait
sits at the right on desktop; project jump links close the opening.

Angrove and inVectus use their real captures inside Stageshow Stage/Camera.
Each desktop scene opens on the product, moves into the meaningful detail,
then returns once and rests. Replay is explicit. Reduced motion shows a complete
still. Phones get a dedicated crop and a still, with no redundant replay control.
These are animated presentations of screenshots, not recordings of app behavior.
The supporting Angrove captures use an asymmetric composition; capabilities
use shared hairlines on desktop. Color literals remain in the tokens file.

## Software-inspired revision, 2026-11-01

The owner rejected the Stageshow marketing treatment as generic, selected a
denser software-inspired direction, and supplied a framed Voxa landing-page
reference. This revision supersedes the Stageshow revision above. Use the
inVectus neutral palette within a continuous page frame, square controls,
short navigation, and narrow hatched registration bands. The name leads with
plain factual copy and an uncropped rectangular portrait on desktop. Product
captures remain static and whole. Both products precede the two-row employment
section. Capabilities are a compact tools list. Preserve the pinned Practice
interaction, with shorter step spacing. No slogan, screenshot zooms, generic
capability tiles, or giant decorative footer wordmark. Stageshow source remains
parked in the repository, but its bundle is not requested by the page.

## Interactive project workspace, 2026-11-01

The owner approved a shared project workspace with clickable annotations.
Angrove and inVectus use accessible tabs in one persistent toolbar. The selected
panel contains its own description, links, metadata, real screenshot, and notes.
Numbered screenshot markers and inspector controls select the same note. Escape
closes the current note; arrow keys, Home, and End navigate project tabs. Direct
links to #invectus and #project-angrove select the corresponding panel. All
content remains visible without JavaScript. No automatic project switching,
zooming, or demo cursor. Supporting Angrove screenshots expand on request.

Annotations describe visible UI and documented behavior, without invented
usability outcomes. Sources: the existing Angrove case study and inVectus README.
The inspector moves below the capture at tablet and phone widths. The existing
Practice section remains the primary scroll interaction.

## Visible project sections, 2026-11-01

The owner requested both products be featured openly rather than behind tabs.
Angrove and inVectus now have separate, always-visible sections under Selected
projects. Remove tab controls, project hiding, tab keyboard handling, and hash
rewriting. Keep each screenshot's independent annotations and inspector, native
direct links, and the expandable supporting Angrove screens.

## Museum field guide, 2026-11-01

Supersedes every revision above. The owner chose a scholarly "museum field guide"
direction: Ryan as a naturalist documenting interfaces and software.

- **Ground:** ivory plate (`#ece5d6`) by default, with a "Night" toggle to a dark
  reading room (`#151311`). The choice is saved in localStorage and applied in the
  head before first paint. Colour literals live only in `css/tokens.css`.
- **Type:** Libre Baskerville (regular) for heads and body; Courier Prime for plate, figure
  and catalogue labels. Oxblood (`#8a3b22`, night `#d08a62`) is the one accent.
- **Framing (full museum):** a title page, a contents list, Exhibits I and II,
  Observations (field notes), Record (client work and instruments), Correspondence.
- **Plates:** five Midjourney engravings with transparent backgrounds in
  double-ruled frames with numbered captions (I optical, II mechanical, III
  botanical, IV shells, V insect collection), plus a moth vignette on the Contents
  rule. The night theme inverts them via `--plate-filter`.
- **Exhibits:** a wall label (specimen table, links, numbered notes) beside a
  mounted capture with roman-numeral callouts (`js/workspace.js`, unchanged logic).
- **Observations:** five field notes drawn only from documented project behaviour.
- **Removed:** the pinned Practice section and `js/practice.js` (owner did not keep it).

## Notebook layer, 2026-11-01

On top of the field guide: a red double margin line with handwritten section
numerals; exhibits as open notebook spreads (fold, stacked page edges, dot-grid
right page, folios matching the contents page numbers); tape on mounted figures,
the supporting figures slightly askew; the moth pinned to the contents rule with
a tag; rubber stamps for status; Caveat for no more than three margin notes with
drawn arrows, plus hand underlines and a circle on the selected numeral (drawn in
on scroll); Observations on ruled paper as journal entries, with a tick on read
entries; plate captions as tags overlapping their frames. Journal entries need real
dates from the owner before any are shown; none are invented.

## Films and postcard, 2026-11-01

Angrove Fig. 1 and Fig. 2 are the two Mac-page films from angrove.app
(`assets/video/`), set straight on the page with no mount; they loop while on
screen and pause off it, and rest on the poster under reduced motion. Screenshot
markers are removed for now; the notes remain as an accordion. Correspondence is
a taped snapshot beside a postcard: message on the left, the address side with an
acorn postage stamp, a postmark, and the contact links as address lines.

## Horizontal exhibits, 2026-11-02

Exhibits share Observations’ ruled-paper background. The two notebook spreads
sit side by side in a native horizontal scroller, with a glimpse of the next
spread, previous/next buttons and a Roman-numeral position indicator. Touch,
trackpad, keyboard and project anchor links work; reduced motion skips smooth
scrolling. The mechanical plate now lives in Angrove’s Further specimens.

## Scroll-driven exhibits, 2026-11-02

Exhibits alone use ruled paper; Observations returns to the standard site ground.
On desktop, the gallery pins below the navigation and normal page scrolling
moves it horizontally, following Angrove’s Map of Your Own Thinking pattern.
At the end it releases into the rest of the page. Buttons and project links map
to the corresponding page-scroll position. Notes on the specimen expand on
request. Expanding notes or supporting specimens releases the pin so all content
remains readable. Small or short viewports and reduced motion use native
horizontal browsing. No wheel interception or scroll lock.
