# DESIGN.md: Personal site

The locked system for `personal-site/`. Since 2026-10-25 every build is also held to the **Hallmark** anti-slop gates (github.com/Nutlope/hallmark, v2.0.0). The stamp at the top of `css/site.css` records the run.

**Brand:** a personal site for Ryan Baltodano only. Don't mention Sine Viridian, which isn't public yet.
**Direction:** an editorial page with a mathematical layer. One serif face, grey paper and ink, viridian used only as a signal, and plotted functions used as figures.
**Job:** hire. Contact sits in the nav, once in the hero, and again at the close.

---

## 1. Principles

1. **Reserved.** Mostly paper and ink. Viridian is a signal (the primary button, links, the featured curve) and covers under 5% of any screen.
2. **One idea per screen.** About 80 words or fewer per 900px screen. Each section is one piece of real content shown large.
3. **Figures, not decoration.** Every graphic is a correctly plotted function or diagram, labelled as a chart (`role="img"` and an `aria-label`), and captioned "Fig. N". No drawn illustrations of objects or scenes.
4. **Show the real thing.** Project sections use real captures of the product. Missing facts are left out, never invented.

## 2. Colour

| Token | Value | Role |
|---|---|---|
| `--paper` | `#EAEAEC` | Page background |
| `--ink` | `#17181C` | Text; the background of the dark band |
| `--viridian` | `#155438` | Accent on paper (7.4 : 1) |
| `--viridian-2` | `#27865B` | Accent on ink and the focus ring. Never used for small text (3.9 : 1). |

Roles use the Hallmark names (`--color-paper`, `-ink`, `-ink-2`, `-muted`, `-faint`, `-rule`, `-accent`, `-accent-ink`, `-area`, `-focus`). They are derived from the four colours above with `color-mix`, and `[data-theme="ink"]` swaps every role at once. Colour literals only ever appear in `css/tokens.css`. No pure black or white.

## 3. Type

- **Libre Baskerville only**, in regular and italic. No bold, and no second family.
- **Scale:** the Hallmark tokens.
  - `--text-poster`: the hero name, around 9rem at 1440px wide.
  - `--text-section`: section heads, 40px or more.
  - `--text-title`: item titles.
  - `--text-lead`, `--text-md` (body, 16px) and `--text-sm` (captions and meta).
- **Labels, captions and nav links** are set a step smaller, in sentence case, with no letter-spacing. Never uppercase small text, and never an eyebrow line above a heading.
- **Headings** are one style and one colour. Never a single word in italic or in the accent colour.
- **Maths** is set in italic, using the real characters (′ ∫ π θ ‖).
- **Copy:** no em or en dashes, and no strings joined by middle dots. Section heads are six words or fewer and say what the reader is looking at.

## 4. Layout

- `.container` is capped at 1440px with 64px gutters (24px under 60rem, 16px under 40rem), on a 12-column grid with a 32px gap.
- Gaps between sections vary: 120, 144 or 176px.
- Seams use different steps of Hallmark's surface ladder: plain whitespace, then one ink band, then a hairline.
- No rounded corners, no shadows, no cards.
- **Chrome:**
  - Nav: one edge-aligned line, with the name on the left and Work, Practice, Capabilities and Contact on the right. Under 40rem only Contact shows.
  - Footer: a one-line colophon.
  - No side rail and no rotated text.

## 5. The page

| Section | Composition | Content |
|---|---|---|
| Hero | Ledge | Fig. 1, y = sin x from 0 to 4π drawn edge to edge, is the field. The name rests at its base, with one sentence, "See the work" and "Email me". |
| Work | Showcase | "Angrove, a private study app". One wide Mac capture, then a pair below at 8 and 4 columns (Mac split view, iPhone insight map). |
| Index | Rows on the ink band | "Selected work, 2024 to now". Five real items: what each was and when. This also carries the career history. |
| Practice | Split, 5 and 7 | "One person, design to code". The 80-case evaluation fact, beside Fig. 2 (sin x, its tangent following the scroll, and ∫₀^π sin x dx = 2). |
| Capabilities | Grid of 4 | Fig. 3a to 3d: sin x, cos x, e^(−x/3) sin 2x, and cos θ for two vectors. Each sits above its title and one line. |
| Close | Split, 6 and 6 | The photo (greyscale), "Write to me", "Open for collaborations.", the email address and GitHub. |
| Footer | Colophon | Name and year, and "Back to top". |

## 6. Figures

- Plotted by `js/plots.js` from the real functions.
- **Grid:** 6% of the text colour.
- **Axes and ticks:** `--color-faint`, with π ticks.
- **Curves:** 1.25px in the text colour. The featured curve is 1.5px in the accent.
- **Areas:** `--color-area`, always shown with their integral.
- The hero curve renders at the SVG's real pixel size and redraws on resize.

## 7. Motion

- **Draw-in:** curves draw in once (`stroke-dashoffset`, 1.8s, ease-out) when their figure comes into view. This is the page's one reveal.
- **Tangent:** the tangent in Fig. 2 follows scroll.
- **Hovers and states:** hovers change colour only. Buttons move 1px on `:active`. The focus ring appears instantly.
- **Reduced motion:** everything shows its final state.
- **Without JavaScript:** content stays visible, and the hidden state is scoped under `.js`.

## 8. Hallmark checks

Run Hallmark's linter, `sloplint`, before shipping:

```bash
node ~/.claude/skills/hallmark/scripts/sloplint.mjs index.html --genre editorial --kept
```

- **Last result:** 0 FAIL and 0 REFLEX, with two contrast warnings dismissed on the record. Those concern the ink band's accent pair, which never carries text.
- **Not yet run:** the render tier needs `puppeteer-core`, so it hasn't been run. Layout was checked by hand at 1280×800, 1440×900 and 375px.
