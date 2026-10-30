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

## 2. Colour: inVectus Instrument theme

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0e0f10` | Page |
| `--surface` | `#151618` | Cards and the index band |
| `--surface-2` | `#1c1d20` | Row hover |
| `--ink` | `#f7f3eb` | Headings and links |
| `--dim` | `#8f8f8a` | Muted text, the second phrase in heads, labels |
| `--mint` | `#6edcaa` | The one signal: focus, the lead work code, the status dot, one accent diagram. Under 2% of any screen. |

- Rules are white at 10%; stronger rules (buttons, pills) at 20%.
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
| Practice | Steps beside a pinned figure | "One person, design to code". Four steps (Interface, Code, Test, Ship) scroll on the left; the figure on the right stays pinned and redraws for the step crossing mid-screen. On phones the figure pins under the nav and the steps scroll beneath it. |
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
- **Practice figure** (`js/practice.js`): canvas scenes in fine stippled dots, after studio Kloroform's "Space 5": one object traced densely (phone with a selection, code editor, 80-case grid beside candidate curves, globe with a flight path), with sparser fanned echoes around it. Dots appear in drawing order over 1.7s, so each scene traces itself in; the previous scene fades out first.
- All are skipped under reduced motion and without JavaScript. Hovers change colour only; the button moves 1px on `:active`.

## 8. Hallmark checks

```bash
node ~/.claude/skills/hallmark/scripts/sloplint.mjs index.html --genre editorial --kept
```

- **Last result:** 4 FAIL, all on gate 38i: the deliberate italic phrases in the four section heads. There are 0 other failures or warnings, and 38ii is waived.
- **Not yet run:** the render tier needs `puppeteer-core`. Layout was checked by hand at 1440×900 and 375px.
