// Expedition-journal interactions: desk objects the cursor knocks around, a field map of the route,
// and pencil marginalia. Each one is optional: without JavaScript the page shows plain content.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const INTERACTIVE = "a, button, input, textarea, select, summary, video, [role='button'], .nav, .field-map, .lightbox";

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

  // Field map: the route from the opening to Contact, with a marker for where the reader stands.
  // Stops sit at equal distances along the drawn path; the marker moves between them with scroll.
  (() => {
    const map = document.querySelector(".field-map");
    if (!map) return;
    const route = map.querySelector(".field-map__path");
    const walked = map.querySelector(".field-map__walked");
    const you = map.querySelector(".field-map__you");
    const stops = [...map.querySelectorAll(".field-map__stop")];
    const sections = stops.map((stop) => document.querySelector(stop.getAttribute("href")));
    const total = route.getTotalLength();
    const span = stops.length - 1;
    stops.forEach((stop, i) => {
      const point = route.getPointAtLength(total * i / span);
      stop.style.left = point.x + "px";
      stop.style.top = point.y + "px";
    });
    let frame = 0, current = -1;
    const place = () => {
      frame = 0;
      const reading = scrollY + innerHeight * 0.35;
      const tops = sections.map((el) => el.getBoundingClientRect().top + scrollY);
      let i = 0;
      while (i < span && reading >= tops[i + 1]) i++;
      let t = i < span ? (reading - tops[i]) / (tops[i + 1] - tops[i]) : 0;
      t = Math.max(0, Math.min(1, t));
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) { i = span; t = 0; }
      const point = route.getPointAtLength(total * Math.min(1, (i + t) / span));
      you.style.translate = `${point.x}px ${point.y}px`;
      walked.setAttribute("height", point.y);
      const at = t > 0.6 && i < span ? i + 1 : i;
      if (at !== current) {
        stops.forEach((stop, n) => n === at ? stop.setAttribute("aria-current", "location") : stop.removeAttribute("aria-current"));
        current = at;
      }
      map.classList.toggle("is-shown", scrollY > innerHeight * 0.4);
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(place); };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    place();
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
