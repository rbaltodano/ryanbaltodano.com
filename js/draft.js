// Each part of the page is drafted before it is inked, as if on a drawing board. Hand-ruled
// construction guides run along the block's edges and top; headings, stamps, and buttons get
// boxes, images crossed boxes, and running text lettering guidelines, all in graphite; pencil
// notes on the design choices are written beside them (from data-draft-note). Then each piece fills in reading
// order as its marks lift away and the notes are rubbed out. The opening drafts on load, every later block the first time it
// scrolls into view. It runs once per visit (?draft replays). A click or key finishes it at once.
// Without JavaScript, with reduced motion, or after the first visit, nothing is held back.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains("is-drafting")) return;
  try { sessionStorage.setItem("drafted", "1"); } catch (e) {}

  const SVG = "http://www.w3.org/2000/svg";
  const EASE = "cubic-bezier(0.55, 0, 0.17, 1)";
  const PARTS = "h1, h2, h3, h4, p, dt, dd, figcaption, img, video, .contact__email, blockquote footer";
  const SKIP = ".desk, .hero__clip, .hero__portrait img, .hero__portrait figcaption, .margin-note, .scribble, .visually-hidden, [hidden], .draft";
  // Large type waits as outlined letters; small type (mono kickers, labels) as guidelines.
  const OUTLINED = "h1, h2, h3, h4, .project__pull p, .contact__email";
  const outlined = (el) => el.matches(OUTLINED) && parseFloat(getComputedStyle(el).fontSize) >= 24;

  // Blocks: the opening; each project's and Experience's title group, then each of their sections;
  // and Contact.
  const blocks = [];
  const hero = document.querySelector(".hero");
  if (hero) blocks.push([hero]);
  document.querySelectorAll(".project, .record").forEach((section) => {
    const kids = [...section.children].filter((el) => !el.matches(".desk, .desk-rest"));
    const title = kids.filter((el) => el.matches(".project__head, .project__title, .project__lede"));
    if (title.length) blocks.push(title);
    kids.filter((el) => !title.includes(el)).forEach((el) => blocks.push([el]));
  });
  const contact = document.querySelector(".contact__inner");
  if (contact) blocks.push([contact]);

  const partsOf = (els) => {
    const found = els.flatMap((el) => [...el.querySelectorAll(PARTS)]).filter((el) =>
      !el.closest(SKIP) && el.getClientRects().length && el.textContent.trim() !== "" || el.matches("img, video") && !el.closest(SKIP) && el.getClientRects().length);
    return found.filter((el) => !found.some((other) => other !== el && other.contains(el)));
  };

  // Hold back every block not yet on screen; the opening is already held by the head script.
  const pending = blocks.map((els) => ({ els, parts: partsOf(els) })).filter((block) => {
    const top = block.els[0].getBoundingClientRect().top;
    const first = block.els[0] === hero;
    if (!first && top < innerHeight) return false;
    block.parts.forEach((el) => el.setAttribute("data-draft-part", outlined(el) ? "outline" : ""));
    return true;
  });

  const running = new Set();
  // A block that fails to draft simply shows; nothing stays held back.
  const draft = (block) => {
    try { drawBlock(block); }
    catch (e) { block.parts.forEach((el) => el.removeAttribute("data-draft-part")); if (block.els[0] === hero) root.classList.remove("is-drafting"); }
  };
  let serial = 0;
  const drawBlock = (block) => {
    const rects = block.els.map((el) => el.getBoundingClientRect());
    const left = Math.min(...rects.map((r) => r.left)), top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right)), bottom = Math.max(...rects.map((r) => r.bottom));
    const w = right - left, h = bottom - top;
    const layer = document.createElement("div");
    layer.className = "draft";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = `left:${left + scrollX}px;top:${top + scrollY}px;width:${w}px;height:${h}px`;
    // Graphite: a little grain displaces every stroke so it reads as pencil, not vector.
    const id = "graphite-" + ++serial;
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.innerHTML = `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="${serial}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.8"/></filter>`;
    const ink = document.createElementNS(SVG, "g");
    ink.setAttribute("filter", `url(#${id})`);
    svg.append(ink);
    layer.append(svg);
    document.body.append(layer);
    const at = (r) => ({ x: r.left - left, y: r.top - top, w: r.width, h: r.height });
    const jitter = (n) => (Math.random() - 0.5) * 2 * n;

    // A hand-ruled line: slightly bowed, running a little past both ends like construction lines.
    const rule = (x1, y1, x2, y2, delay, cls = "draft__box", over = 7, ms = 380, parent = ink) => {
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      const o1 = over * (0.6 + Math.random() * 0.8), o2 = over * (0.6 + Math.random() * 0.8);
      const ax = x1 - ux * o1, ay = y1 - uy * o1, bx = x2 + ux * o2, by = y2 + uy * o2;
      const bow = Math.min(2.2, len / 140);
      const mx = (ax + bx) / 2 - uy * jitter(bow), my = (ay + by) / 2 + ux * jitter(bow);
      const path = document.createElementNS(SVG, "path");
      path.setAttribute("d", `M${ax.toFixed(1)} ${ay.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`);
      path.setAttribute("class", cls);
      path.setAttribute("pathLength", "1");
      parent.append(path);
      path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: ms, delay, easing: EASE, fill: "backwards" });
      return path;
    };
    const box = (x, y, bw, bh, delay, angle = 0, cross = false) => {
      const g = document.createElementNS(SVG, "g");
      if (angle) g.setAttribute("transform", `rotate(${angle} ${x + bw / 2} ${y + bh / 2})`);
      ink.append(g);
      const marks = [
        rule(x, y, x + bw, y, delay, "draft__box", 7, 380, g),
        rule(x + bw, y, x + bw, y + bh, delay + 90, "draft__box", 7, 380, g),
        rule(x + bw, y + bh, x, y + bh, delay + 180, "draft__box", 7, 380, g),
        rule(x, y + bh, x, y, delay + 270, "draft__box", 7, 380, g)
      ];
      if (cross) {
        rule(x, y, x + bw, y + bh, delay + 360, "draft__hatch", 0, 420, g);
        rule(x + bw, y, x, y + bh, delay + 420, "draft__hatch", 0, 420, g);
      }
      return g;
    };
    const rows = (el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const out = [];
      for (const r of range.getClientRects()) {
        if (!r.width) continue;
        const row = out.find((o) => Math.abs(o.top - r.top) < r.height / 2);
        if (row) { row.left = Math.min(row.left, r.left); row.right = Math.max(row.right, r.right); }
        else out.push({ top: r.top, left: r.left, right: r.right, height: r.height });
      }
      return out;
    };
    const rotation = (el) => {
      let angle = 0;
      for (let n = el; n && n !== document.body; n = n.parentElement) angle += parseFloat(getComputedStyle(n).rotate) || 0;
      return angle;
    };

    // Construction guides along the content edges and the block's top.
    const first = block.els[0];
    const padL = parseFloat(getComputedStyle(first).paddingLeft) || 0;
    const padR = parseFloat(getComputedStyle(first).paddingRight) || 0;
    const firstTop = block.parts.length ? at(block.parts[0].getBoundingClientRect()).y : 0;
    rule(padL, 0, padL, h, 0, "draft__guide", 0, 620);
    rule(w - padR, 0, w - padR, h, 80, "draft__guide", 0, 620);
    rule(0, firstTop, w, firstTop, 160, "draft__guide", 0, 620);

    // Outlines in reading order: headings stay as outlined letters (set by CSS); images get
    // crossed boxes, as in a layout sketch; stamps, buttons, and the address get boxes; running
    // text gets lettering guidelines.
    let delay = 120;
    const step = Math.max(24, Math.min(55, 520 / Math.max(1, block.parts.length)));
    const parts = block.parts.map((el) => {
      const marks = [];
      if (el.getAttribute("data-draft-part") === "outline") {
        // drawn by the type itself
      } else if (el.matches("img, video, .stamp, .button")) {
        const r = at(el.getBoundingClientRect());
        const angle = rotation(el);
        const bw = angle ? el.offsetWidth : r.w, bh = angle ? el.offsetHeight : r.h;
        const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        marks.push(box(cx - bw / 2, cy - bh / 2, bw, bh, delay, angle, el.matches("img, video")));
      } else {
        rows(el).forEach((row, i) => {
          const x1 = row.left - left, x2 = row.right - left, y = row.top - top;
          marks.push(rule(x1, y + row.height * 0.34, x2, y + row.height * 0.34, delay + i * 30, "draft__letter", 4, 280));
          marks.push(rule(x1, y + row.height * 0.74, x2, y + row.height * 0.74, delay + i * 30 + 20, "draft__letter", 4, 280));
        });
      }
      const part = { el, marks, done: false };
      delay += step;
      return part;
    });

    // Pencil notes on the design choices, set where they cover nothing: beside, above, or below
    // what they describe, clear of any text, image, or other note nearby.
    const pageW = document.documentElement.clientWidth;
    const near = (r) => r.bottom > top - 240 && r.top < bottom + 240;
    const obstacles = [...document.querySelectorAll(PARTS + ", .scribble, .margin-note, .desk, .stamp, .button")]
      .map((el) => el.getBoundingClientRect()).filter((r) => r.width && near(r)).map(at);
    const clear = (c) => c.x + left >= 8 && c.x + left + c.w <= pageW - 8 &&
      obstacles.every((o) => c.x + c.w + 8 < o.x || c.x - 8 > o.x + o.w || c.y + c.h + 6 < o.y || c.y - 6 > o.y + o.h);
    const notes = block.els.flatMap((el) => [...(el.matches("[data-draft-note]") ? [el] : []), ...el.querySelectorAll("[data-draft-note]")])
      .filter((el) => el.getClientRects().length && !el.closest(SKIP))
      .map((el, i) => {
        const r = at(el.getBoundingClientRect());
        const note = document.createElement("span");
        note.className = "draft__note";
        note.textContent = el.getAttribute("data-draft-note");
        layer.append(note);
        const nw = note.offsetWidth, nh = note.offsetHeight, g = 16;
        const sides = {
          right: [{ x: r.x + r.w + g, y: r.y }, { x: r.x + r.w + g, y: r.y + r.h / 2 - nh / 2 }],
          left: [{ x: r.x - g - nw, y: r.y }, { x: r.x - g - nw, y: r.y + r.h / 2 - nh / 2 }],
          above: [{ x: r.x, y: r.y - g - nh }, { x: r.x + r.w - nw, y: r.y - g - nh }, { x: r.x + r.w / 2 - nw / 2, y: r.y - g - nh }],
          below: [{ x: r.x, y: r.y + r.h + g }, { x: r.x + r.w - nw, y: r.y + r.h + g }, { x: r.x + r.w / 2 - nw / 2, y: r.y + r.h + g }]
        };
        const prefer = el.getAttribute("data-draft-side") || "above";
        const order = [prefer, ...["right", "left", "above", "below"].filter((s) => s !== prefer)];
        const tries = order.flatMap((s) => sides[s]).map((p) => ({ ...p, w: nw, h: nh }));
        const spot = tries.find(clear) || tries[0];
        obstacles.push(spot);
        note.style.left = spot.x + "px";
        note.style.top = spot.y + "px";
        note.style.rotate = jitter(2.4).toFixed(1) + "deg";
        const start = 260 + i * 220;
        note.animate([{ clipPath: "inset(-20% 100% -30% -4%)" }, { clipPath: "inset(-20% -4% -30% -4%)" }], { duration: 650, delay: start, easing: "cubic-bezier(0.45, 0.05, 0.4, 1)", fill: "backwards" });
        return { el, note, end: start + 650 };
      });

    // Fill: once outlined, each piece inks in quickly as its marks lift away. The notes stay a
    // second after the block is finished, then are rubbed out.
    const FILL = delay + 150, GAP = Math.max(30, Math.min(70, 500 / Math.max(1, parts.length)));
    const DRAWN = FILL + parts.length * GAP + 450;
    const ERASE = Math.max(DRAWN, ...notes.map((n) => n.end)) + 1000;
    const erase = (n, now) => {
      if (n.gone) return;
      n.gone = true;
      if (now) return n.note.remove();
      const smudge = document.createElement("span");
      smudge.className = "draft__smudge";
      smudge.style.cssText = `left:${n.note.offsetLeft - 8}px;top:${n.note.offsetTop - 4}px;width:${n.note.offsetWidth + 16}px;height:${n.note.offsetHeight + 8}px`;
      layer.append(smudge);
      smudge.animate([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 1100, fill: "forwards" });
      n.note.animate([
        { opacity: 1, translate: "0 0", filter: "blur(0)" },
        { opacity: 0.6, translate: "4px 0", filter: "blur(0.4px)", offset: 0.25 },
        { opacity: 0.35, translate: "-4px 1px", filter: "blur(0.8px)", offset: 0.5 },
        { opacity: 0.14, translate: "3px 0", filter: "blur(1.2px)", offset: 0.75 },
        { opacity: 0, translate: "0 0", filter: "blur(1.6px)" }
      ], { duration: 620, easing: "linear", fill: "forwards" });
    };
    const fill = (part, now) => {
      if (part.done) return;
      part.done = true;
      // Outlined headings fill with ink instead of replaying their ink reveal.
      if (part.el.matches("[data-ink]")) part.el.classList.add("is-inked");
      part.el.classList.add("is-drafted");
      if (!now && part.el.getAttribute("data-draft-part") !== "outline" && !part.el.matches("[data-settle], [data-stamp], [data-rise]")) {
        part.el.animate([{ opacity: 0, filter: "blur(2px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 420, easing: EASE });
      }
      part.marks.forEach((m) => m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: now ? 1 : 360, delay: now ? 0 : 80, fill: "forwards" }));
    };
    const timers = parts.map((part, i) => setTimeout(() => fill(part), FILL + i * GAP));
    const job = { finish: null };
    let done = false;
    const close = () => {
      layer.remove();
      parts.forEach((part) => { part.el.removeAttribute("data-draft-part"); part.el.classList.remove("is-drafted"); });
      running.delete(job);
    };
    job.finish = (now) => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      parts.forEach((part) => fill(part, now));
      if (block.els[0] === hero) root.classList.remove("is-drafting");
      if (now) return close();
      // Every piece is inked; the notes linger, then are rubbed out and the guides lift away.
      setTimeout(() => {
        notes.forEach((n) => erase(n, false));
        layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 560, delay: 500, fill: "forwards" }).finished.then(close);
      }, Math.max(0, ERASE - DRAWN));
    };
    timers.push(setTimeout(() => job.finish(false), DRAWN));
    running.add(job);
  };

  // A click or key press finishes whatever is drafting.
  const skip = () => running.forEach((job) => job.finish(true));
  addEventListener("pointerdown", skip);
  addEventListener("keydown", skip);

  // Measure once the type has loaded, or the outlines won't match the lines.
  const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
  fonts.then(() => {
    const later = pending.filter((block) => block.els[0] !== hero);
    const opening = pending.find((block) => block.els[0] === hero);
    if (opening) draft(opening);
    if (!("IntersectionObserver" in window)) return later.forEach((block) => block.parts.forEach((el) => el.removeAttribute("data-draft-part")));
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const block = later.find((b) => b.els[0] === entry.target);
      io.unobserve(entry.target);
      if (block) draft(block);
    }), { rootMargin: "0px 0px -22% 0px" });
    later.forEach((block) => io.observe(block.els[0]));
  });
})();
