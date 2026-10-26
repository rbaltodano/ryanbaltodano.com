# DESIGN.md: Personal site

The locked system for `personal-site/`. Since 2026-10-25 every build is also held to the **Hallmark** anti-slop gates (github.com/Nutlope/hallmark, v2.0.0). The stamp at the top of `css/site.css` records the run.

**Brand:** a personal site for Ryan Baltodano only. Don't mention Sine Viridian, which isn't public yet.
**Direction (since 2026-10-26):** scholarly, on Angrove's light cream, with small plain shapes. Instrument Serif headings in Angrove's dark brown, with olive italic emphasis, and Instrument Sans body text on Angrove's light cream, and simple polygons used only as accents on cards and rows. No background patterns, no fractals, and no calculus imagery.
**Job:** hire. Contact sits in the nav, once in the hero, and again at the close.

---

## 1. Principles

1. **Reserved and scholarly.** Cream paper, dark-brown serif heads and quiet sans body text, like a well-set journal. Olive is a signal (links, italic emphasis, accent shapes) and covers under 5% of any screen.
2. **One idea per screen.** About 80 words or fewer per 900px screen. Each section is one piece of real content shown large.
3. **Shapes as accents, never backgrounds.** Only plain polygons (triangle, square, pentagon, hexagon, heptagon), small, on a card corner or beside a row title. No lattices, nesting, spirals or fractals. They come from one inline SVG sprite with no script.
4. **Show the real thing.** Project sections use real captures of the product. Missing facts are left out, never invented.

## 2. Colour: Angrove light cream, dark headings

Taken from `AngroveTheme.swift`. The page uses light-mode values, except that headings use the dark-mode canvasSecondary.

| Token | Value | Angrove name | Role |
|---|---|---|---|
| `--cream` | `#FFFAF0` | canvasSecondary (light) | Page background |
| `--cream-2` | `#F3EEE2` | canvas (light) | Cards |
| `--heading` | `#24201C` | canvasSecondary (dark) | Headings (15.5 : 1); also the dark band behind the work index |
| `--brown` | `#4A321C` | primaryBrown / paragraphText | Body text at 85% (about 7 : 1), captions and meta at 74% (4.9 : 1) |
| `--olive` | `#86803E` | lightGreen (light) | Italic emphasis in heads only (3.9 : 1, large text) |
| `--olive-deep` | `#6F6844` | darkGreen (light) | Links, glyphs and accent shapes (5.4 : 1) |
| `--olive-dark-mode` | `#B7AE78` | lightGreen (dark) | Accents and emphasis on the dark band |
| `--ink-button` | `#2A2520` | canvasTertiary (light) | The one filled button, with cream text |

- Rules use brownBorder (`#220F01`) at 10%.
- The dark band (`[data-theme="panel"]`) swaps to cream text and the dark-mode olive.
- Colour literals only ever appear in `css/tokens.css`.

## 3. Type

- **Instrument Serif** for display: the hero name, section heads and item titles, in regular and italic. Tracking is −0.01em (−0.02em on the name).
- **Instrument Sans** for everything else: body text at 17px with a 1.65 line height, captions, nav and labels. Regular and medium weights only.
- **Italic emphasis (owner's choice):** one phrase per head may be set in olive italic, such as "Angrove, a *private* study app", plus one phrase in the hero sentence. This matches Angrove's own olive italics. It breaks Hallmark gates 38i and 38iii on purpose, and the reason is recorded in the stamp.
- **Labels, captions and nav links** are set a step smaller, in sentence case, with no letter-spacing. No eyebrow lines.
- **Copy:** no em or en dashes, and no strings joined by middle dots. Section heads are six words or fewer.

## 4. Layout

- `.container` is capped at 1440px with 64px gutters (24px under 60rem, 16px under 40rem), on a 12-column grid with a 32px gap.
- Gaps between sections vary: 120, 144 or 176px. Seams use whitespace, one canvasSecondary band, and a hairline.
- **Cards:** light canvas (`#F3EEE2`) with a 16px radius, no border and no shadow. They hold the capabilities, the practice shapes and the contact block. Never a card inside a card.
- **Chrome:** the nav is one edge-aligned line (the name, then Work, Practice, Capabilities and Contact; under 40rem only Contact shows). The footer is a one-line colophon.

## 5. The page

| Section | Composition | Content |
|---|---|---|
| Hero | Banner | The name, one sentence, "See the work" and "Email me". No background. |
| Work | Showcase | "Angrove, a private study app". One wide Mac capture, then a pair below at 8 and 4 columns. |
| Index | Rows on the dark band (`#24201C`) | "Selected work, 2024 to now". Five real items, each with a small olive polygon before its title (three to seven sides, in order). |
| Practice | Split, 6 and 6 | "One person, design to code". The 80-case evaluation fact, beside a card showing a triangle, square, pentagon and hexagon in a row, the last in olive. |
| Capabilities | Bento of 4 cards (7 and 5 over 5 and 7) | Design, Front end, Apps and Systems. Each card has one shape in its top-right corner (triangle, square, hexagon, pentagon) and its text at the bottom. |
| Close | Split, 6 and 6 | The greyscale photo, beside a contact card with a small triangle: "Write to me", "Open for collaborations.", the email address, GitHub, the résumé and the case study. |
| Footer | Colophon | Name and year, and "Back to top". |

## 6. Shapes

- **Sprite:** five `<symbol>`s at the top of `index.html`: triangle, square, pentagon, hexagon and heptagon, each a regular polygon in a 100×100 box.
- **Card corner:** 56px, a 1.5px stroke at the faint brown step, with no fill.
- **Practice row:** 72px each, and the last shape is olive with a 16% olive fill.
- **Row glyph:** 0.7em, a 1.25px olive stroke, placed before the work title.
- Strokes use `vector-effect: non-scaling-stroke`, so lines stay the same weight at every size.

## 7. Motion

- No reveal and no scroll effects. The page is still.
- **Hovers and states:** hovers change colour only. The button moves 1px on `:active`. The focus ring is olive and appears instantly.

## 8. Hallmark checks

```bash
node ~/.claude/skills/hallmark/scripts/sloplint.mjs index.html --genre editorial --kept
```

- **Last result:** 4 FAIL, all on gate 38i: the deliberate italic phrases in the four section heads. There are 0 other failures or warnings, and 38ii is waived.
- **Not yet run:** the render tier needs `puppeteer-core`. Layout was checked by hand at 1440×900 and 375px.
