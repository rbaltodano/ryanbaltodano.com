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

Each dotted trail draws in once, right to left (between Angrove and inVectus the compass rules a straight line instead, left to right; see below), the first time it enters the viewport (a 1.6s clip-path wipe), then stays static. No idle marching. Reduced motion shows them fully drawn.

### Experience on ruled paper

The Experience section reuses the old exhibit stage ground: full-bleed paper-2 with 32px blue ruling (`--ruling-image`), hairlines top and bottom.

### Experience layout

Heading and the shells plate stack in the left column (4fr); the intro, roles, education and tools read down the right (8fr). Phones stack heading, plate, then content.
On desktop the left column (heading + plate) is sticky at 112px while the right column scrolls; phones leave it static.

### Desk objects

Objects peek in from alternating page edges at irregular, fixed positions; do not
randomize on reload. Postage stamp on the right
of the opening trail, ruler below the inVectus orbits illustration, 75% beyond the left edge and tilted 12° clockwise,
fern rotated −45° beneath Angrove’s title at the right edge, compass rotated −45° in the matching space beneath inVectus’s title at the right edge,
key on the left after inVectus, tape on the right of Experience, wax seal at the
left footer edge. The photo and shells illustration no longer hold these objects.

Use a consistent physical scale: ruler at the content width, paperclip 54px (on the portrait), fern 200px wide,
compass 280px, key 240px long, postage stamp and seal 64px, tape 140px. Keep at
least 200px of the key visible so it reads larger than the seal. No CSS shadows.
Desk objects stay static except for the compass and ruler drawing sequence. Phones retain the content-width ruler and smaller tape. All remain decorative (the cursor knocks them; see below), dimmed at night, and clear
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

### Figure captions

Lead and feature captures show only their "Fig. N" label under the media. The
description lives in the media's `data-caption` and appears in the lightbox
label card under the same accent mono "Fig. N" title.

### Drafted page

Once per visit (sessionStorage; `?draft` replays), each block is drafted before
it is inked, as on a drawing board (`js/draft.js`). Blocks: the opening; each
project's and Experience's title group and each later section; Contact. The
opening drafts on load, later blocks the first time they reach 78% down the
viewport. Everything is graphite in `--draft` (heading ink at 50%) with a slight
grain displacement: hand-ruled construction guides that overrun their ends along
the content edges and top; large type (24px and up: headings, pull quotes, the
address) waits as outlined letters and fills with ink; crossed boxes for images and
videos (rotated with their frames); boxes for stamps and buttons; two lettering
guidelines per line of smaller text. Content fills quickly in reading order (about
1s from a block's start). Pencil notes (Caveat), set in `data-draft-note` (with an
optional preferred `data-draft-side`) on the element they describe, are placed
where they cover no text, image, or other note, write in on the design choices,
stay a second after the block is fully drawn, then are rubbed out with a faint
smudge. A click or key finishes it at once. Blocks already on screen at load
(other than the opening), reduced motion, a URL hash, or no JavaScript skip it; a
block that fails to draft shows normally.

### Portrait arrival

On load the portrait is slid up above everything (z-index 400, over the nav) from
below the bottom centre of the screen, turning from its 4 degrees to 8, to rest in
the middle of the viewport (1.1s, `cubic-bezier(0.16, 1, 0.3, 1)`). The rest of the
opening is hidden (`html.is-awaiting-photo`) until the portrait's first move after
that; then it appears, or drafts on a first visit. The portrait is then moved by
hand on the menu curve: diagonally down and to the right (620ms), up into its place
still at 7.5 degrees (560ms), and finally turned to its 4 degrees (380ms), with
short beats between. A paperclip (54px, rotated 98 degrees, 6px from the corner and set deep
over the edge) then slides down over the top right corner to pin it, and the photo dips under it. The drafted opening
draws no outline for the portrait. Once per page load. Reduced motion, a URL hash,
or the portrait off screen at load shows everything in place. Head-script timeouts
release the opening after 4s and the portrait after 8s regardless.

### Compass rules the line over inVectus

Between Angrove and inVectus there is no dotted trail: a straight 1px ink rule spans
the content width just above inVectus's label. When it is 60% in view, the drafting compass enters from the
left edge to the rule's left end, then rides it to the right with its point on
the line, leaning about −18 degrees with a slight rock to keep the other leg above the ruler, while a mask reveals the
line behind it (1.7s). Before drawing, the content-width ruler slides up from below the viewport (0.85s), with its top edge 3px below the line. The ruler image is turned 180° so its markings face upright. It stays straight while the compass draws, then slides completely off the left edge at the drawing height (0.65s). Once the inVectus orbits illustration comes into view, it slides back in from the left (1.05s) below the illustration, resting 75% off the left edge and rotated 12° clockwise. The compass then runs off the right of the page and, once its resting
place beside the inVectus title is on screen, slides in from the right with
friction to rest. Skipped with reduced motion, on screens where the compass is
hidden, or when the trail is already on screen at load.

### Statement letters

The opening statement is split into one span per letter (`js/site.js`; the h1 keeps
its aria-label). Once the opening is released by the portrait's first move, the
letters appear one at a time, 45ms apart (360ms each), replacing the heading's ink
reveal. On a drafted visit they appear as outlines in that order and later fill
with ink in the same order. Reduced motion shows the statement whole.

### Eye trail label and trail spacing

Dotted trails are 340px tall on desktop (200px at 60rem and below), giving the
sections more room. As each dotted trail draws, a pencil note, "Eye trail" (Caveat
in `--draft`, with a graphite grain filter, `#graphite` in the icon sprite), writes
in beside the point 62% along its path. The label and the entire dotted line
are rubbed out together over 620ms as soon as the line finishes drawing. The
section spacing stays in place. The ruled line into inVectus has no label. Reduced motion
shows no label.

### Fern placement at Angrove

The fern waits horizontally centered, 80px below the center of Angrove's heading,
as it scrolls into view. When the
heading reaches the middle of the screen, it pauses, slides down and right, then
moves out to its usual right-edge position and turns into place (2.5s total, with
the portrait's menu easing and small pauses). It runs once per load. The fern is
busy during placement so cursor nudges cannot interrupt it. Reduced motion,
mobile layouts where the fern is hidden, and visits restored below Angrove keep
the resting layout. Resizing during placement settles it immediately.
