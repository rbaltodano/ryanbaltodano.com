# Personal site

## Purpose

Show Ryan’s product and web design work and make contact easy. Use direct headings,
factual descriptions, real product captures, and clear links. Remove copy that
repeats the layout or explains an ordinary control.

## Design

Keep the scholarly field-guide character through ivory paper, Libre Baskerville,
Courier Prime, engraved illustrations, notebook spreads, and the ruled Exhibits
background. Night mode uses the same layout with shared color tokens.

- One navigation: Exhibits, Experience, Contact.
- The opening contains Ryan’s name, background, approach, work link, and email, with Ryan’s headshot. The portrait sits closer to the name and
  lower in the composition, with one small moth engraving tucked behind its edge.
  A fine horizontal rule connects the hero; email is visually secondary to View work.
- Exhibits have two equal-height spreads, up to 1480px wide, 550px apart.
- Normal desktop page scrolling drives the pinned horizontal gallery. It releases
  into Experience after the second project. No wheel interception or scroll lock.
- Ruled lines stay stationary. Cards sit above the margin line.
- Small/short viewports and reduced motion use native horizontal scrolling.
- Design notes and additional screens use native HTML details. Expanding them
  releases the pin so the entire content remains readable.
- Each project has a visible workflow overview and a design decision beside its
  capture. Deeper ownership, implementation, and evaluation details stay in Design
  notes. Observations have no separate section.
- Exhibit cards use plain paper without a dot grid. Experience contains actual
  employment responsibilities, education, and tools grouped by use. Contact contains
  email, GitHub, and résumé.
- Keep useful product status, platform, technology, and screenshot descriptions.
  Avoid taglines, helper text, repeated section labels, and decorative numbering.

## Implementation

`index.html` owns content and semantic structure. `css/tokens.css` owns theme and
spacing values, `css/base.css` the reset, and `css/site.css` the page layout.
`js/site.js` handles the theme, year, and visible video playback.
`js/workspace.js` handles gallery scrolling, controls, keyboard shortcuts, and
project hashes. Project names come from their headings. Notes need no JavaScript.

Keep existing project/section IDs and external links stable. No framework or build
is required for the live page. Do not revive the parked Stageshow demos as part
of routine site edits.

## Verification

Check desktop and phone widths, equal card heights, the 550px gap, pinned scroll
and release, project hashes, previous/next and keyboard controls, native details,
themes, reduced motion, and usable content without JavaScript. Check local links
and browser errors. Bump CSS/JS cache queries when publishing.

## Typography

Use only four shared size tokens. Do not add component-specific font sizes.

| Role | Desktop | Phone (640px and below) |
|---|---:|---:|
| Display: Ryan’s name | 56px | 40px |
| Heading: sections and projects | 32px | 28px |
| Body: descriptions, notes, links, captions, company names, tools | 16px | 16px |
| Metadata: navigation, buttons, labels, dates, status, sources, footer | 12px | 12px |

Libre Baskerville remains the content face; Courier Prime marks metadata.

Content is grounded in the current résumé, Angrove case study, and inVectus README.
Do not add unverified outcomes, user counts, or performance claims.

## Statements and roomy exhibits, 2026-11-02

Influenced by dakshgajjar.com, kept in the field-guide voice. The hero is one
large serif statement ("I design software, and keep notes along the way.") with
a taped portrait. Two large type roles join the scale: `--text-statement` and
`--text-poster` (project wordmarks). A dashed ink trail draws with scroll between
the hero and each exhibit. Exhibits are stacked vertical sections again (no pinned
horizontal scroll, no paper background): wordmark and stamp, a lead capture,
the project story with a specimen table and a pull quote, a four-step walkthrough
with real screenshots, a second feature, and visible design notes. Motion: hero
lines rise, wordmarks reveal, figures settle, stamps press in, links underline in
ink; all skipped under reduced motion.
