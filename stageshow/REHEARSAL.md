# Rehearsal: portfolio product scenes

Gold: dark-hero and fade-crop, copied into gold/. Kept the large product surface,
edge bleed, quiet page ground, compact redesign, and one focal detail. Replaced
invented demo UI with Ryan's real product captures and the Stage/Camera kit.
The actual screenshot already contains its real window chrome.

Beats: complete product; 1.6s hold; 1.5s push into the study notes or coverage-gap
evidence; reading hold; 1.5s return to overview; rest. Once, with explicit Replay.
No cursor or fake app actions. Phone layouts are composed stills.

Captured in headless Chrome 156 on macOS: 1440, 390, and 320 page layouts;
wide camera contact sheets; 390 reduced-motion stills; dark reference still.
No page errors, missing images, or horizontal document overflow at those widths.
Build: npm run build passes. Runtime bundle approximately 181 KB JS and 18 KB CSS
before compression. HTML captures remain if the enhancement cannot load.

Film: mobile reduced-motion gate passes. Wide Angrove gate has zero prohibited
findings, but motion coverage is inconclusive because of sampling gaps (largest
150ms); this is not a full automated motion pass. Camera movement is excluded
from the geometry scanner and was inspected in contact sheets. Early barrel
imports loaded unrelated Phone CSS and caused false override reports; direct
Stage/Camera imports removed that CSS and reduced the stylesheet by 56 KB.
The initial phone crop cut the evidence score; the final crop includes it.

Assumptions: source captures and all product claims come from the existing site.
No new model, research, or app behavior is claimed.
Not checked: physical iPhone, Safari, full frame-by-frame coverage of every camera
transition. Browser automation uses an isolated headless browser only.

Fresh-eye review: found two issues in captured frames. Widened Angrove's detail
focus to include both note columns; the revised detail still passes the gate.
Initialized reduced-motion Practice canvases immediately, including offscreen
figures. The phone recapture shows all four diagrams. Replay resets to overview
for both products; changing to reduced motion restores the still poster.
InVectus states gate has zero prohibited findings; its motion sampling remains
inconclusive (largest gap 110ms). No claim of complete frame-level verification.
