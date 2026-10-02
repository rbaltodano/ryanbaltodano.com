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
  features.html       How to use the app: Ask, Branch, Keep, Map (Insight Tree), Return, commands, habits
  how-it-works.html   Redirect to features.html
  insight-tree.html   Redirect to features.html#map
  model.html          Redirect to privacy.html#model (the model details now live on Privacy)
  privacy.html        What stays on the phone, claims linked to the public source, live offline demo, model details (#model)
  about.html          Founder note, the four principles, public repositories
  waitlist.html       Launch status: development milestones (email signup is not open yet)
  blog/index.html     Empty state until the first posts
  css/site.css        All tokens and components
  css/demos.css       Internal-page interaction styles
  js/site.js          Mobile menu, smooth scrolling, headline reveal
  js/hero-phone.js    Home hero: live question, streamed answer, floating Insights
  js/privacy-demo.js  Privacy: a question answered in airplane mode, with what did and didn't happen
  js/page-demos.js    Local-only internal-page interactions
  js/insight-tree.js  Home page Insight Tree animation (port of the app's canvas and Study mode)
  js/grounding-demo.js  Home Library card: Library cards scrolling in a loop that follows page scroll
  assets/home/        Images exported from Figma
  assets/app/         Real app screenshots and the Study demo video (from Aquinas-iOS/Documentation)
```

Each page repeats the same header and footer markup; update all of them together.
The interactive examples are illustrations, not live app inference. The three Library excerpts
come from the bundled `passages.json` corpus; the explanatory connections are editorial copy.

## Still to do

- Add a real email signup service before restoring any waitlist form or promise to email visitors.
- Write the first blog posts.
- Keep the model details on `privacy.html#model` in step with the app's model. As of 2026-10-02 the
  main build uses the Gemma 4 E4B LiteRT Community package (not fine-tuned) on LiteRT-LM.

## Source docs

Copy sources: `../WEBSITE_COPY.md`, `../CONTENT.md`, and the Aquinas-Foundations docs
(`MISSION.md`, `FUNCTIONALITY.md`, `MODEL-INTEGRATION.md`).
