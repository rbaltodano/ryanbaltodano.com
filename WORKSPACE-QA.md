# Project workspace verification

2026-11-01, isolated headless Chrome on macOS.

At 1440, 768, 390, and 320 CSS pixels, verified project selection changes the
visible panel and selected tab; clicking a screenshot marker selects its matching
note; clicking an inspector note updates the matching marker; Escape closes the
note; arrow keys and End move tab focus and selection; reloading an inVectus
direct link retains that project. No page errors or document overflow.

With JavaScript disabled, both project panels and all six interface notes are
readable, screenshot markers stay hidden, and project links remain ordinary
anchors. Screenshots reviewed at desktop and phone widths. Motion is a short
panel/note fade and follows the site's reduced-motion rule.

Not checked: physical-device rendering or screen-reader speech output.
