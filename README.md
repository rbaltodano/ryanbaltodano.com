# Aquinas — Website

Plain HTML/CSS/JS, no build step. Open `index.html` directly in a browser, or serve the folder:

```bash
cd site
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Pages

```
site/
  index.html          Home (built from Figma "source-of-truth" / Home, node 169:7019)
  guide.html          The app's User Guide (Settings → User Guide) word for word: First Five Minutes, eleven topics, Try It app windows
  faq.html            Common questions: release, cost, privacy, the model and its sources
  features.html       Redirect to guide.html (also how-it-works.html, insight-tree.html)
  model.html          Redirect to faq.html (the model question)
  privacy.html        Redirect to guide.html#privacy (the Privacy page was retired 2026-10-04)
  about.html          Founder note, the four principles, public repositories
  case-study.html     Case Studies: current product, architecture, decisions, and supporting research
  waitlist.html       Launch status: development milestones (email signup is not open yet)
  blog/index.html     Empty state until the first posts
  css/site.css        All tokens and components
  css/demos.css       Internal-page interaction styles
  js/site.js          Mobile menu, smooth scrolling, headline reveal, FAQ accordions
  js/dot-field.js     Dot-grid background for [data-dot-field] sections: idle shimmer, a ripple from the pointer every 2 s, and a ripple on click/tap
  js/boot.js          Home startup: the app's growing leaf/dots, waits for first-screen images
  js/boot-assets.js   Streams first-screen image downloads once; feeds the loading percentage
  js/hero-phone.js    Home hero: live question, streamed answer, floating Insights
  js/guide.js         Guide: the topic list marks the topic being read
  js/guide-tasks.js   Guide: the Model Tasks practice queue
  js/map-flow.js       Home: the pinned photo panel that scrolls horizontally from answer to Insight to tree, which turns into Study in place
  js/page-demos.js    Local-only internal-page interactions
  js/insight-tree.js  Home page Insight Tree animation (port of the app's canvas and Study mode; one scroll-driven tree/3D view)
  js/grounding-demo.js  Home Library card: Library cards scrolling in a loop that follows page scroll
  assets/home/        Images exported from Figma
  assets/brand/       Brand assets, including boot leaf frames and dots from the app
  assets/app/         Real app screenshots and the Study demo video (from Angrove-iOS/Documentation)
```

Each page repeats the same header and footer markup; update all of them together.
The interactive examples are illustrations, not live app inference. The three Library excerpts
come from the bundled `passages.json` corpus; the explanatory connections are editorial copy.

Home startup downloads about 2.13 MB of critical images. The web-optimized vine sheets preserve
the original 24 frames and dimensions; each idle loop still repeats grow frames 21–24 at 4 fps.
The boot percentage tracks received bytes, holds below 100% until decoding and preparation
finish, and then the page reveals. Vine growth starts only after the page reveal completes.
The download deadline resets when bytes arrive, so a healthy slow transfer is not cancelled.
Original vine exports remain available alongside the `*-paint-web.webp` versions.
The boot mark fades in and out over 0.5 seconds, followed by the app's 1.5-second page reveal
(0.3-second opacity-only reveal with reduced motion). Scroll and page interaction stay locked
until the reveal finishes. Home loads and reloads start at the top; explicit section links retain
their destination.

## Still to do

- Add a real email signup service before restoring any waitlist form or promise to email visitors.
- Write the first blog posts.
- Keep the FAQ's model answer in step with the app's model. As of 2026-10-02 the
  main build uses the Gemma 4 E4B LiteRT Community package (not fine-tuned) on LiteRT-LM.

## Source docs

Copy sources: `../WEBSITE_COPY.md`, `../CONTENT.md`, and the Angrove-Foundations docs
(`MISSION.md`, `FUNCTIONALITY.md`, `MODEL-INTEGRATION.md`).

## Encryption copy

Use **Fully Encrypted** with the scope “Your saved personal data is encrypted on your device.”
The home, About, FAQ, User Guide, launch page, blog and shared footer use this wording.
The guide’s privacy topic explains AES-256-GCM, Keychain keys, local backups and recovery,
and that deliberate conversation exports remain readable JSON. Appearance preferences, public
books/model assets, displayed content and Apple-managed backup protection are outside this claim.

## Case Studies

`case-study.html` is linked after About in every primary navbar and footer, and from the About
essay. It uses the October 5, 2026 captures in `assets/app/case-study-2026-10-05/` and the existing Study clip; the full product walkthrough
will be recorded separately. The report distinguishes historical simulator comparisons from
independent acceptance, phone performance, user outcomes and release status. Source text and
aggregate evaluation evidence live in Angrove-iOS `Documentation/Case-Study.md` and
`Documentation/Evaluation.md`. Keep the values aligned when new evidence is published.

The seven current JPEG originals are preserved unchanged. The Case Studies page groups them into
product, semantic-map documentation, and expanded source-detail galleries with full-size image
links. The two technical diagrams are mobile browser captures of the website User Guide.
The Nature of Evil conversation shows Corpus Grounded details and Summa Theologica links.
Matching originals live in the iOS repo’s dated Screenshots directory.

The page leads with the problem and Ryan’s role, followed by the current product, architecture,
and engineering decisions. Measured evaluation and earlier model exploration follow as supporting
evidence, with next steps last. Dates preserve the chronology of the work without making readers
start with the oldest experiments. The existing URL remains `case-study.html`.
