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

## Contact, lightbox, and moving trails, 2026-11-02

- Paragraph text (`--ink-2`) is the heading ink at 75% opacity in both themes.
- Videos and window captures have no outline ring, only a soft shadow.
- `js/lightbox.js` is ported from angrove.app: media tilts toward the cursor and
  grows 1% on hover with a maximum 1.5° tilt. Cursor influence is softened
  near the center with a squared response and an 800ms follow/return transition; a click or Return opens it full screen with its figure
  caption; a click, Esc, or scroll returns it. Decorative images (empty alt) and
  the nav are excluded.
- Trails march slowly (stroke-dashoffset) and also draw in with scroll; trails now
  lead into Experience and Contact. Reduced motion stops both.
- Contact closes the page with a statement ("Let's compare notes."), the email set
  large with an ink underline on hover, four facts, and an "Available for work"
  stamp.

### Trails, revised

Each dotted trail draws in once, right to left (the trail into inVectus runs left to right), the first time it enters the viewport (a 1.6s clip-path wipe), then stays static. No idle marching. Reduced motion shows them fully drawn.

### Experience on ruled paper

The Experience section reuses the old exhibit stage ground: full-bleed paper-2 with 32px blue ruling (`--ruling-image`), hairlines top and bottom.

### Experience layout

Heading and the shells plate stack in the left column (4fr); the intro, roles, education and tools read down the right (8fr). Phones stack heading, plate, then content.
On desktop the left column (heading + plate) is sticky at 112px while the right column scrolls; phones leave it static.

### Desk objects

Objects peek in from alternating page edges at irregular, fixed positions; do not
randomize on reload. Paperclip at the left hero edge, postage stamp on the right
of the opening trail, ruler on the right between Angrove’s feature and notes,
fern rotated −45° beneath Angrove’s title at the right edge, compass rotated −45° in the matching space beneath inVectus’s title at the right edge,
key on the left after inVectus, tape on the right of Experience, wax seal at the
left footer edge. The photo and shells illustration no longer hold these objects.

Use a consistent physical scale: ruler 600px, paperclip 70px, fern 200px wide,
compass 280px, key 240px long, postage stamp and seal 64px, tape 140px. Keep at
least 200px of the key visible so it reads larger than the seal. No CSS shadows.
Desk objects stay static and do not use the reveal/settle observer. Phones retain the ruler and tape at
smaller sizes. All remain decorative (the cursor knocks them; see below), dimmed at night, and clear
of text/captures. Originals are in `assets/desk/src/` (git-ignored).

### Heading ink reveal

Headings reveal once through three continuously expanding, soft-edged CSS masks.
The spread, opacity, and blur-to-sharp filter run for 2000ms with Angrove’s
mobile-menu curve, `cubic-bezier(0.55, 0, 0.17, 1)`. Native mask-size interpolation
expands the masks smoothly, replacing the visibly stepped
25-frame sprite. No text shadow, movement, or layout change. No image request.
The mask and blur are removed at completion so final type is completely sharp.
Project wordmarks include vertical padding with matching negative margins so
the mask contains descenders and blur without changing the surrounding layout.
Reduced motion, no JavaScript, or unsupported masking shows normal type.
Desk objects remain static. The unused original sprite and its license are
retained in `assets/motion/` for attribution and reference.

### Navigation and iPhone safe areas

The fixed header is flush to the viewport with an opaque paper background.
`viewport-fit=cover` lets that background cover the status-bar area. Padding from
`env(safe-area-inset-top)` keeps controls below the notch. Shared nav-height and
safe-area tokens reserve the same space above the page and for anchor scrolling.
Container gutters respect left/right safe areas in landscape; the page also
reserves bottom safe-area space. No scroll-position JavaScript is involved.

### Angrove title action

The Angrove title block contains a filled primary “Visit Angrove” link. It sits
at the lower right beneath the large wordmark on desktop and follows the status
stamp on phones. The summary above the title has no duplicate visit link. Reuse
the shared button styles and theme colors; keep the wordmark full-sized.

### Section spacing

Use the shared 144px section gap for project separation, Experience padding, and
Contact padding at every viewport size. Internal content spacing and decorative
trail heights retain their own proportions.

## Expedition journal interactions, 2026-11-03

`js/journal.js` owns these; each degrades to plain content without JavaScript.

- Desk objects get knocked: the cursor passing over an object's opaque pixels
  (alpha hit test) pushes it up to 10px along the cursor's path, scaled by speed,
  with up to 3 degrees of turn for off-centre hits, over 160ms; it returns over
  0.75s on `cubic-bezier(0.55, 0, 0.17, 1)`. One knock per pass. Touch: a tap
  knocks it away. Off under reduced motion.
- Field map: a fixed dashed route in the left margin at 75rem and wider, with stops
  for Opening, Angrove, inVectus, Experience, and Contact. A marker follows scroll;
  the walked part turns accent. Labels show on hover or focus. Hidden at the top.
- Marginalia: pencil notes (Caveat, `--pencil`) under a pull quote, a step, and a
  design note per project. They write in on hover (touch: on scroll) and stay.
  Notes are drafts paraphrasing existing copy; Ryan to approve wording.
- Lightbox viewing table: paper ground (`--table`), the media on a mount with crop
  marks and a scale, the caption as a label card.

### Project lede

Each project's one-line description sits under its wordmark, left-aligned at
46ch. The label row above the wordmark holds only the exhibit label.

### Phone portrait

At 60rem and below the hero portrait sits right-aligned under the statement.
