// Expedition-journal interactions: desk objects the cursor knocks around and pencil
// marginalia. Each one is optional: without JavaScript the page shows plain content.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const INTERACTIVE = "a, button, input, textarea, select, summary, video, [role='button'], .nav, .lightbox";

  // Desk objects: the cursor knocks them around as it passes over them (a tap does on touch), and
  // they ease back to their places. Hit testing reads each image's alpha, so only the object
  // itself reacts, never the transparent corners of its rotated box.
  (() => {
    const objects = [...document.querySelectorAll(".desk")];
    if (!objects.length) return;
    const alpha = new Map();
    const sample = (img) => {
      if (alpha.has(img)) return alpha.get(img);
      if (!img.complete || !img.naturalWidth) return null;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const data = { ctx, w: canvas.width, h: canvas.height };
      alpha.set(img, data);
      return data;
    };
    const hit = (x, y) => objects.find((img) => {
      if (!img.offsetParent) return false;
      const box = img.getBoundingClientRect();
      if (x < box.left || x > box.right || y < box.top || y > box.bottom) return false;
      const clip = img.parentElement.closest(".desk-rest");
      if (clip) {
        const c = clip.getBoundingClientRect();
        if (x < c.left || x > c.right || y < c.top || y > c.bottom) return false;
      }
      const angle = (parseFloat(getComputedStyle(img).rotate) || 0) * Math.PI / 180;
      const dx = x - (box.left + box.width / 2), dy = y - (box.top + box.height / 2);
      const w = img.offsetWidth, h = img.offsetHeight;
      const u = dx * Math.cos(angle) + dy * Math.sin(angle) + w / 2;
      const v = -dx * Math.sin(angle) + dy * Math.cos(angle) + h / 2;
      if (u < 0 || v < 0 || u > w || v > h) return false;
      const data = sample(img);
      if (!data) return false;
      return data.ctx.getImageData(Math.floor(u / w * data.w), Math.floor(v / h * data.h), 1, 1).data[3] > 40;
    });

    // A knock pushes the object along the cursor's direction of travel (farther for a faster
    // cursor; an off-centre hit also turns it), then it returns over 0.75s on Angrove's menu curve.
    const OUT_MS = 160, BACK_MS = 750;
    const knock = (img, x, y, vx, vy) => {
      const speed = Math.hypot(vx, vy);
      if (speed < 0.05) return;
      const distance = Math.min(10, speed * 6);
      const ux = vx / speed, uy = vy / speed;
      const box = img.getBoundingClientRect();
      const size = Math.max(box.width, box.height);
      const rx = (x - (box.left + box.width / 2)) / size, ry = (y - (box.top + box.height / 2)) / size;
      const turn = Math.max(-3, Math.min(3, (rx * uy - ry * ux) * distance * 0.6));
      const from = getComputedStyle(img).transform;
      if (img.dataset.busy) return;
      img.getAnimations().forEach((motion) => motion.cancel());
      img.animate([
        { transform: from === "none" ? "none" : from, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        { transform: `translate(${(ux * distance).toFixed(2)}px, ${(uy * distance).toFixed(2)}px) rotate(${turn.toFixed(2)}deg)`, offset: OUT_MS / (OUT_MS + BACK_MS), easing: "cubic-bezier(0.55, 0, 0.17, 1)" },
        { transform: "none" }
      ], { duration: OUT_MS + BACK_MS });
    };

    if (reduce) return;
    // Touch: a tap knocks the object away from the finger.
    document.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" || e.target.closest(INTERACTIVE)) return;
      const img = hit(e.clientX, e.clientY);
      if (!img) return;
      const box = img.getBoundingClientRect();
      const dx = box.left + box.width / 2 - e.clientX, dy = box.top + box.height / 2 - e.clientY;
      const length = Math.hypot(dx, dy) || 1;
      knock(img, e.clientX, e.clientY, dx / length * 1.2, dy / length * 1.2);
    });
    if (!finePointer) return;
    // Mouse: brushing past knocks it once along the cursor's path; it won't react again until the
    // cursor has left it.
    let frame = 0, last = null, prev = null, inside = null;
    document.addEventListener("pointermove", (e) => {
      last = { x: e.clientX, y: e.clientY, t: e.timeStamp, target: e.target };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const now = last, before = prev;
        prev = now;
        if (!before || now.t - before.t > 120 || now.target.closest(INTERACTIVE)) { inside = null; return; }
        const img = hit(now.x, now.y);
        if (img === inside) return;
        inside = img;
        if (!img) return;
        const dt = Math.max(8, now.t - before.t);
        knock(img, now.x, now.y, (now.x - before.x) / dt, (now.y - before.y) / dt);
      });
    }, { passive: true });
  })();

  // On load the portrait is slid up from below the bottom centre of the screen, above everything,
  // turning from its 4 degrees to 8 as it comes to rest in the middle. The rest of the opening waits
  // for it: as the portrait makes its first move after that, the opening is released (and drafts,
  // on a first visit). The portrait is then moved by hand: diagonally down to the right, up into its
  // place, and finally turned to its 4 degrees; a paperclip then slides over its top right corner.
  (() => {
    const root = document.documentElement;
    const portrait = document.querySelector(".hero__portrait");
    const clip = portrait && portrait.querySelector(".hero__clip");
    const release = () => root.classList.remove("is-awaiting-photo");
    if (!portrait || reduce) { release(); return root.classList.add("is-placed"); }
    const place = async () => {
      const box = portrait.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) { release(); return root.classList.add("is-placed"); }
      const EASE = "cubic-bezier(0.55, 0, 0.17, 1)";
      const cx = document.documentElement.clientWidth / 2 - (box.left + box.width / 2);
      const cy = innerHeight / 2 - (box.top + box.height / 2);
      const below = innerHeight - box.top + 60;
      const middle = `translate(${cx.toFixed(0)}px, ${cy.toFixed(0)}px) rotate(4deg)`;
      const lower = `translate(${(cx * 0.42).toFixed(0)}px, ${(Math.max(cy, 0) + 90).toFixed(0)}px) rotate(3deg)`;
      const placed = "rotate(3.5deg)";
      const move = (from, to, ms, delay = 0, easing = EASE) =>
        portrait.animate([{ transform: from }, { transform: to }], { duration: ms, delay, easing, fill: "forwards" }).finished;
      portrait.classList.add("is-sliding");
      // Slid up from the bottom centre, turning from 4 degrees to 8 overall.
      await move(`translate(${cx.toFixed(0)}px, ${below.toFixed(0)}px) rotate(0deg)`, middle, 1100, 0, "cubic-bezier(0.16, 1, 0.3, 1)");
      // First move: the rest of the opening starts as the portrait is pushed down and to the right.
      release();
      await move(middle, lower, 620, 60);
      // Up into its place, still at its loose angle.
      await move(lower, placed, 560, 90);
      // And turned to its final 4 degrees.
      await move(placed, "none", 380, 140);
      portrait.getAnimations().forEach((motion) => motion.cancel());
      portrait.classList.add("is-landed");
      if (!clip) return root.classList.add("is-placed");
      portrait.classList.add("is-clipped");
      clip.animate([
        { transform: "translate(0, -26px)", opacity: 0, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        { transform: "translate(0, 2px)", opacity: 1, offset: 0.7, easing: "ease-in-out" },
        { transform: "none", opacity: 1 }
      ], { duration: 460, delay: 120 }).finished.then(() => root.classList.add("is-placed"));
      portrait.animate([{ transform: "none" }, { transform: "translate(0, 1.5px)" }, { transform: "none" }], { duration: 240, delay: 420 });
    };
    requestAnimationFrame(() => requestAnimationFrame(place));
  })();

  // The fern waits over Angrove's heading, then is moved by hand to its edge position.
  (() => {
    const fern = document.querySelector(".desk--fern");
    const heading = document.querySelector("#title-angrove");
    if (!fern || !heading || reduce || !fern.offsetParent || !("IntersectionObserver" in window)) return;
    // A visit restored below Angrove should leave the object in its resting place.
    if (heading.getBoundingClientRect().bottom < 0) return;
    fern.loading = "eager";
    fern.dataset.busy = "1";
    fern.style.zIndex = "400";
    let started = false, motion;
    const clear = () => {
      fern.style.removeProperty("translate");
      fern.style.removeProperty("transform");
      fern.style.removeProperty("z-index");
      delete fern.dataset.busy;
      window.removeEventListener("resize", resize);
    };
    const prepare = () => {
      fern.style.removeProperty("translate");
      fern.style.removeProperty("transform");
      const home = fern.getBoundingClientRect(), title = heading.getBoundingClientRect();
      const x = document.documentElement.clientWidth / 2 - (home.left + home.width / 2);
      const y = title.top + title.height / 2 + 80 - (home.top + home.height / 2);
      fern.style.translate = `${x}px ${y}px`;
      fern.style.transform = "rotate(12deg)";
      return { x, y };
    };
    const resize = () => {
      if (started || !fern.offsetParent) {
        watch.disconnect();
        clear();
        motion?.cancel();
      } else prepare();
    };
    prepare();
    const watch = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watch.disconnect();
      const { x, y } = prepare();
      started = true;
      const center = `${x}px ${y}px`;
      const lower = `${x + 100}px ${y + 90}px`;
      const ease = "cubic-bezier(0.55, 0, 0.17, 1)";
      motion = fern.animate([
        { translate: center, transform: "rotate(12deg)" },
        { translate: center, transform: "rotate(12deg)", offset: 0.18, easing: ease },
        { translate: lower, transform: "rotate(5deg)", offset: 0.43 },
        { translate: lower, transform: "rotate(5deg)", offset: 0.48, easing: ease },
        { translate: "-18px 24px", transform: "rotate(-4deg)", offset: 0.77 },
        { translate: "-18px 24px", transform: "rotate(-4deg)", offset: 0.82, easing: ease },
        { translate: "0px 0px", transform: "none" }
      ], { duration: 2500, fill: "forwards" });
      motion.finished.then(() => {
        clear();
        motion.cancel();
      }).catch(() => clear());
    }, { rootMargin: "-40% 0px -40% 0px" });
    watch.observe(heading);
    window.addEventListener("resize", resize, { passive: true });
  })();

  // The drafting compass rules the line over inVectus. It rides the line from its left end to its
  // right, leaning into the stroke with its point on the line as the line appears behind it, runs
  // off the right of the page, then slides back in from the right to rest beside the inVectus title.
  (() => {
    const trail = document.querySelector(".trail--compass");
    const compass = document.querySelector(".desk--compass");
    const ruler = document.querySelector(".desk--ruler");
    if (!trail || !compass || reduce || !compass.offsetParent || !("IntersectionObserver" in window)) return;
    if (trail.getBoundingClientRect().top < innerHeight) return;   // already passed: leave both as they are
    const SVGNS = "http://www.w3.org/2000/svg";
    const svg = trail.querySelector("svg"), line = svg.querySelector("path");
    // A mask with the same route, revealed from its start (left) toward its far end.
    const mask = document.createElementNS(SVGNS, "mask");
    mask.id = "compass-trail";
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    ["x", "y"].forEach((k) => mask.setAttribute(k, "-100"));
    mask.setAttribute("width", "1200");
    mask.setAttribute("height", "500");
    const reveal = document.createElementNS(SVGNS, "path");
    reveal.setAttribute("d", line.getAttribute("d"));
    reveal.setAttribute("fill", "none");
    reveal.setAttribute("stroke", "#fff");
    reveal.setAttribute("stroke-width", "40");
    reveal.setAttribute("pathLength", "1");
    reveal.setAttribute("stroke-dasharray", "1 1");
    reveal.setAttribute("stroke-dashoffset", "1");
    mask.append(reveal);
    svg.prepend(mask);
    line.setAttribute("mask", "url(#compass-trail)");
    trail.classList.add("is-compass");
    compass.classList.add("is-away");
    compass.dataset.busy = "1";
    if (ruler) {
      ruler.classList.add("is-away");
      ruler.dataset.busy = "1";
    }

    const length = line.getTotalLength();
    const TIP = { x: 0.03, y: 0.985 };          // the drawing leg's point, as a fraction of the image
    const rest = () => { const r = compass.getBoundingClientRect(); return { x: r.left + r.width / 2 + scrollX, y: r.top + r.height / 2 + scrollY }; };
    const pointAt = (t) => {
      const p = line.getPointAtLength(length * t), m = svg.getScreenCTM();
      return { x: m.a * p.x + m.c * p.y + m.e + scrollX, y: m.b * p.x + m.d * p.y + m.f + scrollY };
    };
    // Put the point at page position p with the compass turned to `angle` degrees overall.
    const pose = (home, p, angle) => {
      const w = compass.offsetWidth, h = compass.offsetHeight, a = angle * Math.PI / 180;
      const vx = (TIP.x - 0.5) * w, vy = (TIP.y - 0.5) * h;
      const tx = vx * Math.cos(a) - vy * Math.sin(a), ty = vx * Math.sin(a) + vy * Math.cos(a);
      compass.style.translate = `${(p.x - tx - home.x).toFixed(1)}px ${(p.y - ty - home.y).toFixed(1)}px`;
      compass.style.transform = `rotate(${(angle + 45).toFixed(2)}deg)`;
    };
    const run = (ms, ease, step) => new Promise((done) => {
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / ms);
        step(ease(k));
        if (k < 1) requestAnimationFrame(tick); else done();
      };
      requestAnimationFrame(tick);
    });
    const inOut = (k) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const easeIn = (k) => k * k * k;
    const easeOut = (k) => 1 - Math.pow(1 - k, 3);

    const draw = async () => {
      const home = rest();
      // Tilt the other leg above the straightedge while the drawing point follows the line.
      const start = pointAt(0), lean = -18;
      // Bring the ruler up from below the viewport and hold its top edge under the stroke.
      let rulerHome;
      const placeRuler = (x, y, angle = 0) => {
        ruler.style.translate = `${x - rulerHome.x}px ${y - rulerHome.y}px`;
        ruler.style.rotate = `${180 + angle}deg`;
      };
      if (ruler) {
        ruler.style.rotate = "0deg";
        const box = ruler.getBoundingClientRect();
        rulerHome = { x: box.left + scrollX, y: box.top + scrollY };
        const below = Math.max(innerHeight + scrollY, start.y) + ruler.offsetHeight + 40;
        placeRuler(start.x, below);
        ruler.classList.remove("is-away");
        await run(850, easeOut, (k) => {
          const edge = pointAt(0);
          placeRuler(edge.x, below + (edge.y + 3 - below) * k);
        });
      }
      compass.classList.remove("is-away");
      // In from the left edge to the start of the line.
      const enter = { x: -compass.offsetWidth + scrollX - 40, y: start.y - 40 };
      await run(380, easeOut, (k) => pose(home, { x: enter.x + (start.x - enter.x) * k, y: enter.y + (start.y - enter.y) * k }, lean + 6 * (1 - k)));
      // Draw, left to right.
      await run(1700, inOut, (k) => {
        reveal.setAttribute("stroke-dashoffset", (1 - k).toFixed(4));
        pose(home, pointAt(k), lean + 3 * Math.sin(k * Math.PI * 3));
        if (ruler) { const edge = pointAt(0); placeRuler(edge.x, edge.y + 3); }
      });
      reveal.setAttribute("stroke-dashoffset", "0");
      // Off the right of the page.
      const end = pointAt(1), exitX = document.documentElement.clientWidth + compass.offsetWidth + scrollX + 40;
      const rulerStart = pointAt(0);
      await Promise.all([
        run(520, easeIn, (k) => pose(home, { x: end.x + (exitX - end.x) * k, y: end.y - 30 * k }, lean + 10 * k)),
        // Slide the whole ruler off the left edge at the drawing height first.
        ruler ? run(650, easeIn, (k) => {
          const offLeft = scrollX - ruler.offsetWidth - 40;
          placeRuler(rulerStart.x + (offLeft - rulerStart.x) * k, rulerStart.y + 3);
        }) : Promise.resolve()
      ]);
      if (ruler) {
        ruler.classList.add("is-away");
        ruler.style.removeProperty("translate");
        ruler.style.removeProperty("rotate");
        // Wait for the illustration below, then slide in horizontally at the resting tilt.
        const rulerWatch = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          rulerWatch.disconnect();
          const away = -ruler.getBoundingClientRect().right - 40;
          ruler.animate([
            { translate: `${away}px 0px` },
            { translate: "0px 0px" }
          ], { duration: 1050, easing: "cubic-bezier(0.12, 0.8, 0.3, 1)" })
            .finished.then(() => delete ruler.dataset.busy);
          ruler.classList.remove("is-away");
        }, { rootMargin: "0px 0px -10% 0px" });
        rulerWatch.observe(ruler.closest(".project__plate"));
      }
      compass.classList.add("is-away");
      compass.style.removeProperty("translate");
      compass.style.removeProperty("transform");
      settle();
    };
    // Then, once its place is on screen, in from the right to rest.
    const settle = () => {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const away = document.documentElement.clientWidth - compass.getBoundingClientRect().left + 40;
        compass.classList.remove("is-away");
        compass.animate([
          { translate: `${away}px 18px`, transform: "rotate(14deg)" },
          { translate: "-10px 0px", transform: "rotate(-2deg)", offset: 0.75 },
          { translate: "0px 0px", transform: "none" }
        ], { duration: 1050, easing: "cubic-bezier(0.12, 0.8, 0.3, 1)" }).finished.then(() => delete compass.dataset.busy);
      }, { rootMargin: "0px 0px -15% 0px" });
      io.observe(compass.closest(".project__intro") || compass);
    };

    const watch = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      watch.disconnect();
      trail.classList.add("is-in");
      draw();
    }, { threshold: 0.6 });
    watch.observe(trail);
  })();

  // Each dotted trail gets a pencil label while it draws, then both are rubbed out.
  (() => {
    if (reduce) return;
    document.querySelectorAll(".trail:not(.trail--rule)").forEach((trail) => {
      const svg = trail.querySelector("svg"), path = svg && svg.querySelector("path");
      if (!path) return;
      const note = document.createElement("span");
      note.className = "trail__note";
      note.setAttribute("aria-hidden", "true");
      note.textContent = "Eye trail";
      trail.append(note);
      const show = () => {
        const p = path.getPointAtLength(path.getTotalLength() * 0.62), m = svg.getScreenCTM();
        const box = trail.getBoundingClientRect();
        if (m) {
          const x = m.a * p.x + m.c * p.y + m.e - box.left, y = m.b * p.x + m.d * p.y + m.f - box.top;
          const right = x < box.width / 2;
          note.style.left = right ? x + 28 + "px" : "auto";
          note.style.right = right ? "auto" : box.width - x + 28 + "px";
          note.style.top = y - 34 + "px";
        }
        note.classList.add("is-shown");
        note.animate([{ clipPath: "inset(-30% 100% -40% -6%)" }, { clipPath: "inset(-30% -6% -40% -6%)" }], { duration: 700, delay: 350, easing: "cubic-bezier(0.45, 0.05, 0.4, 1)", fill: "backwards" });
        let erased = false;
        const erase = () => {
          if (erased) return;
          erased = true;
          clearTimeout(fallback);
          svg.removeEventListener("transitionend", onDrawn);
          const lineErase = path.animate([
            { opacity: 0.85, filter: "blur(0)", clipPath: "inset(-10px)" },
            { opacity: 0.5, filter: "blur(0.4px)", offset: 0.25 },
            { opacity: 0.25, filter: "blur(0.8px)", offset: 0.5 },
            { opacity: 0, filter: "blur(1.6px)", clipPath: "inset(-10px -10px -10px 100%)" }
          ], { duration: 620, easing: "ease-in-out", fill: "forwards" });
          lineErase.finished.then(() => {
            path.style.visibility = "hidden";
            lineErase.cancel();
          });
          note.animate([
            { opacity: 1, translate: "0 0", filter: "url(#graphite) blur(0)" },
            { opacity: 0.6, translate: "4px 0", filter: "url(#graphite) blur(0.4px)", offset: 0.25 },
            { opacity: 0.35, translate: "-4px 1px", filter: "url(#graphite) blur(0.8px)", offset: 0.5 },
            { opacity: 0.14, translate: "3px 0", filter: "url(#graphite) blur(1.2px)", offset: 0.75 },
            { opacity: 0, translate: "0 0", filter: "url(#graphite) blur(1.6px)" }
          ], { duration: 620, fill: "forwards" }).finished.then(() => note.remove());
        };
        const onDrawn = (event) => {
          if (event.target === svg && event.propertyName === "clip-path") erase();
        };
        svg.addEventListener("transitionend", onDrawn);
        // A fallback also cleans up when the browser skips the transition (e.g. a hidden tab).
        const fallback = setTimeout(erase, 1700);
      };
      if (trail.classList.contains("is-in")) return note.remove();
      const watch = new MutationObserver(() => {
        if (!trail.classList.contains("is-in")) return;
        watch.disconnect();
        show();
      });
      watch.observe(trail, { attributes: true, attributeFilter: ["class"] });
    });
  })();

  // Marginalia: pencil notes write themselves in when their passage is pointed at, and stay.
  // Touch screens have no hover, so there they write in as they scroll into view.
  (() => {
    const notes = document.querySelectorAll(".margin-note");
    if (!notes.length) return;
    const write = (note) => note.classList.add("is-written");
    if (finePointer) {
      notes.forEach((note) => {
        const passage = note.closest("li, .project-note, .project__pull") || note.parentElement;
        passage.addEventListener("pointerenter", () => write(note), { once: true });
        passage.addEventListener("focusin", () => write(note), { once: true });
      });
      return;
    }
    if (!("IntersectionObserver" in window)) return notes.forEach(write);
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      write(entry.target);
      io.unobserve(entry.target);
    }), { rootMargin: "0px 0px -25% 0px" });
    notes.forEach((note) => io.observe(note));
  })();
})();
