// Each part of the page is drafted before it is inked, as if on a drawing board. Hand-ruled
// construction guides run along the block's edges and top; headings, stamps, and buttons get
// boxes, images crossed boxes, and running text lettering guidelines, all in graphite; pencil
// notes on the design choices are written beside them (from data-draft-note). Then each piece fills in reading
// order, with illustrated pencils and pens following the marks; erasers clear the temporary
// graphite as each mark is finished. The opening drafts on load, every later block the first time it
// scrolls into view. It runs on each page load. A click or key finishes it at once.
// Without JavaScript or with reduced motion, nothing is held back.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains("is-drafting")) return;

  const SVG = "http://www.w3.org/2000/svg";
  const EASE = "cubic-bezier(0.55, 0, 0.17, 1)";
  // One speed multiplier keeps tools, marks, writing and cleanup on the same clock.
  const PACE = 1.6;
  const animate = (element, frames, options) => element.animate(frames, {
    ...options, duration: options.duration / PACE, delay: (options.delay || 0) / PACE
  });
  const schedule = (callback, delay) => setTimeout(callback, delay / PACE);
  const lightDraft = matchMedia("(max-width: 48rem), (pointer: coarse)").matches;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  // These are the owner's transparent tool illustrations, not the extension's code.
  const toolAssets = { pencil: "pencil.png", pen: "fountain-pen.png", eraser: "eraser.png" };
  const readyTools = Promise.all(Object.values(toolAssets).map((file) => {
    const image = new Image();
    image.src = "assets/desk/drafting/" + file;
    return image.decode().catch(() => {});
  }));

  // A small crew shares a timeline. Each tool travels between measured tasks;
  // drawing and wiping use the same points and clock as the working tip.
  const crewFor = (layer) => {
    const workers = {};
    const motions = [];
    const reserve = (kind, points, earliest, duration) => {
      const pool = workers[kind] ||= Array.from({ length: lightDraft ? 1 : kind === "pencil" ? 3 : 2 }, () => ({ free: 0, jobs: [] }));
      const worker = pool.reduce((a, b) => a.free <= b.free ? a : b);
      const approach = lightDraft ? 110 : 160;
      const start = Math.max(earliest, worker.free) + approach;
      const end = start + duration;
      worker.jobs.push({ points, start, end, approach });
      worker.free = end + 55;
      return { start, end, duration };
    };
    const play = () => Object.entries(workers).forEach(([kind, pool]) => pool.forEach((worker) => {
      if (!worker.jobs.length) return;
      const tool = document.createElement("span");
      tool.className = `draft__tool draft__tool--${kind}`;
      const image = document.createElement("img");
      image.src = "assets/desk/drafting/" + toolAssets[kind];
      image.alt = "";
      tool.append(image);
      layer.append(tool);
      const total = worker.free + 240;
      const frames = [];
      let previous = null;
      const frame = (time, point, opacity, angle) => frames.push({
        offset: Math.max(0, time / total), opacity,
        transform: `translate3d(${point.x}px, ${point.y}px, 0) rotate(${angle}deg)`
      });
      worker.jobs.forEach((job) => {
        const first = job.points[0], last = job.points.at(-1);
        // The pencil asset points up; the pen's nib points down.
        const direction = last.x >= first.x ? -32 : 28;
        const angle = kind === "pencil" ? 180 + direction : kind === "pen" ? direction : -12;
        const entry = previous || { x: first.x - 42, y: first.y + 45 };
        if (!previous) frame(0, entry, 0, angle - 8);
        frame(job.start - job.approach, entry, previous ? 1 : 0, angle - 8);
        frame(job.start, first, 1, angle);
        job.points.slice(1).forEach((point, i) => frame(job.start + (job.end - job.start) * (i + 1) / (job.points.length - 1), point, 1, angle + (kind === "eraser" ? Math.sin(i * 2.4) * 7 : Math.sin(i) * 2)));
        previous = last;
      });
      frame(worker.free, previous, 1, kind === "pencil" ? 155 : -25);
      frame(total, { x: previous.x + 45, y: previous.y - 55 }, 0, kind === "pencil" ? 145 : -35);
      motions.push(animate(tool, frames, { duration: total, fill: "forwards" }));
    }));
    return { reserve, play, cancel: () => motions.forEach((animation) => animation.cancel()) };
  };
  const PARTS = "h1, h2, h3, h4, p, dt, dd, figcaption, img, video, .button, .hero__actions > a, .contact__email, blockquote footer";
  const SKIP = ".desk, .hero__clip, .contact__clip, .hero__portrait img, .hero__portrait figcaption, .margin-note, .scribble, .visually-hidden, [hidden], .draft";
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
    const first = block.els[0] === hero;
    // A section link can land in the middle of the page. Draft what is visible there
    // and the blocks below it; leave content already above the viewport readable.
    if (!first && block.els.every((el) => el.getBoundingClientRect().bottom <= 0)) return false;
    block.parts.forEach((el) => el.setAttribute("data-draft-part", outlined(el) ? "outline" : ""));
    return true;
  });

  const running = new Set();
  // A block that fails to draft simply shows; nothing stays held back.
  const draft = (block) => {
    if (motion.matches) {
      block.parts.forEach((el) => el.removeAttribute("data-draft-part"));
      return;
    }
    // Finish the previous sketch when scrolling into the next one instead of
    // repainting several section-sized drawing surfaces at once on a phone.
    if (lightDraft) running.forEach((job) => job.finish(true));
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
    if (!lightDraft) svg.innerHTML = `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="${serial}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.8"/></filter>`;
    const ink = document.createElementNS(SVG, "g");
    if (!lightDraft) ink.setAttribute("filter", `url(#${id})`);
    svg.append(ink);
    layer.append(svg);
    document.body.append(layer);
    const crew = crewFor(layer);
    const drawnPaths = [];
    const at = (r) => ({ x: r.left - left, y: r.top - top, w: r.width, h: r.height });
    const jitter = (n) => (Math.random() - 0.5) * 2 * n;

    // A hand-ruled line: slightly bowed, running a little past both ends like construction lines.
    let strokes = 0;
    const rule = (x1, y1, x2, y2, delay, cls = "draft__box", over = 7, ms = 380, parent = ink) => {
      if (strokes >= (lightDraft ? 12 : 36)) return null;
      strokes++;
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
      const length = path.getTotalLength();
      const matrix = path.getCTM();
      const points = Array.from({ length: 17 }, (_, i) => {
        const p = path.getPointAtLength(length * i / 16);
        return new DOMPoint(p.x, p.y).matrixTransform(matrix);
      });
      const task = crew.reserve("pencil", points, delay, Math.min(lightDraft ? 220 : 300, 110 + len * 0.18));
      animate(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: task.duration, delay: task.start, easing: "linear", fill: "backwards" });
      drawnPaths.push({ path, points, end: task.end });
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
      if (cross && !lightDraft) {
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
    const reveals = [];
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
        const lines = rows(el);
        (lightDraft ? lines.slice(0, 1) : lines).forEach((row, i) => {
          const x1 = row.left - left, x2 = row.right - left, y = row.top - top;
          marks.push(rule(x1, y + row.height * 0.34, x2, y + row.height * 0.34, delay + i * 30, "draft__letter", 4, 280));
          if (!lightDraft) marks.push(rule(x1, y + row.height * 0.74, x2, y + row.height * 0.74, delay + i * 30 + 20, "draft__letter", 4, 280));
        });
      }
      const part = { el, marks: marks.filter(Boolean), done: false };
      delay += step;
      return part;
    });

    // Pencil notes on the design choices, set where they cover nothing: beside, above, or below
    // what they describe, clear of any text, image, or other note nearby.
    const pageW = document.documentElement.clientWidth;
    const near = (r) => r.bottom > top - 240 && r.top < bottom + 240;
    const obstacleElements = lightDraft ? block.parts : [...document.querySelectorAll(PARTS + ", .scribble, .margin-note, .desk, .stamp, .button")];
    const obstacles = obstacleElements
      .map((el) => el.getBoundingClientRect()).filter((r) => r.width && near(r)).map(at);
    const clear = (c) => c.x + left >= 8 && c.x + left + c.w <= pageW - 8 &&
      obstacles.every((o) => c.x + c.w + 8 < o.x || c.x - 8 > o.x + o.w || c.y + c.h + 6 < o.y || c.y - 6 > o.y + o.h);
    const notes = block.els.flatMap((el) => [...(el.matches("[data-draft-note]") ? [el] : []), ...el.querySelectorAll("[data-draft-note]")])
      .filter((el) => el.getClientRects().length && !el.closest(SKIP) && !el.matches(".hero__portrait"))
      .slice(0, lightDraft ? 1 : 3)
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
        const spot = tries.find(clear);
        if (!spot) { note.remove(); return null; }
        obstacles.push(spot);
        note.style.left = spot.x + "px";
        note.style.top = spot.y + "px";
        note.style.rotate = jitter(2.4).toFixed(1) + "deg";
        const task = crew.reserve("pen", [{ x: spot.x, y: spot.y + nh * 0.7 }, { x: spot.x + nw, y: spot.y + nh * 0.7 }], 300 + i * 180, Math.min(700, 240 + nw * 1.4));
        animate(note, [{ clipPath: "inset(-20% 100% -30% -4%)" }, { clipPath: "inset(-20% -4% -30% -4%)" }], { duration: task.duration, delay: task.start, easing: "linear", fill: "backwards" });
        return { el, note, end: task.end };
      }).filter(Boolean);

    // Ink each passage after its construction marks. Erasers trail individual
    // finished marks while pencils and pens continue elsewhere in the block.
    const pencilEnd = Math.max(0, ...drawnPaths.map((p) => p.end));
    parts.forEach((part, i) => {
      const r = at(part.el.getBoundingClientRect());
      const dependencies = drawnPaths.filter(({ path }) => part.marks.some((mark) => mark === path || mark.contains(path)));
      const earliest = Math.max(320 + i * 45, ...dependencies.map((p) => p.end));
      const text = !part.el.matches("img, video");
      if (text && (part.el.matches(OUTLINED) || part.el.closest(".hero"))) {
        const lines = rows(part.el);
        const points = lines.length ? lines.flatMap((row) => [
          { x: row.left - left, y: row.top - top + row.height * 0.75 },
          { x: row.right - left, y: row.top - top + row.height * 0.75 }
        ]) : [{ x: r.x, y: r.y + r.h * 0.7 }, { x: r.x + r.w, y: r.y + r.h * 0.7 }];
        part.task = crew.reserve("pen", points, earliest, Math.min(lightDraft ? 420 : 700, 220 + r.w * 0.45));
        if (lines.length) {
          // A stepped polygon retains finished lines while the nib writes the
          // next one. The return journey never rewinds already revealed text.
          part.inkFrames = lines.flatMap((row, rowIndex) => {
            const lineTop = rowIndex ? (row.top - top - r.y) / r.h * 100 : -12;
            const lineBottom = rowIndex === lines.length - 1 ? 112 : (lines[rowIndex + 1].top - top - r.y) / r.h * 100;
            return [0, 1].map((edge) => ({
              offset: (rowIndex * 2 + edge) / (lines.length * 2 - 1),
              clipPath: (() => {
                const x = (row[edge ? "right" : "left"] - left - r.x) / r.w * 100 + (edge ? 1 : -1);
                return `polygon(-2% -12%, 102% -12%, 102% ${lineTop}%, ${x}% ${lineTop}%, ${x}% ${lineBottom}%, -2% ${lineBottom}%)`;
              })()
            }));
          });
        }
      } else part.task = { start: earliest, end: earliest + 300, duration: 300 };
    });
    const DRAWN = Math.max(pencilEnd, ...parts.map((p) => p.task.end), ...notes.map((n) => n.end)) + 100;
    const erase = (n, now) => {
      if (n.gone) return;
      n.gone = true;
      if (now) return n.note.remove();
      animate(n.note, [{ clipPath: "inset(-20% -4% -30% -4%)" }, { clipPath: "inset(-20% -4% -30% 104%)" }], { duration: 500, easing: "linear", fill: "forwards" });
      if (lightDraft) return;
      const smudge = document.createElement("span");
      smudge.className = "draft__smudge";
      smudge.style.cssText = `left:${n.note.offsetLeft - 8}px;top:${n.note.offsetTop - 4}px;width:${n.note.offsetWidth + 16}px;height:${n.note.offsetHeight + 8}px`;
      layer.append(smudge);
      animate(smudge, [{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 1100, fill: "forwards" });
    };
    const fill = (part, now) => {
      if (part.done) return;
      part.done = true;
      // Outlined headings fill with ink instead of replaying their ink reveal.
      if (part.el.matches("[data-ink]")) part.el.classList.add("is-inked");
      part.el.classList.add("is-drafted");
      if (!now && !part.inkFrames && part.el.getAttribute("data-draft-part") !== "outline" && !part.el.matches("[data-settle], [data-stamp], [data-rise]")) {
        reveals.push(animate(part.el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: EASE }));
      }
      if (now) part.marks.forEach((mark) => { mark.style.opacity = "0"; });
    };
    const timers = parts.map((part) => schedule(() => {
      fill(part);
      // A pen reveals each line in its measured reading order.
      if (part.inkFrames) reveals.push(animate(part.el, part.inkFrames, { duration: part.task.duration, easing: "linear" }));
    }, part.task.start));
    // Queue cleanup by readiness, so a late construction line cannot hold up
    // an already finished annotation. Only temporary graphite is erased.
    const cleanup = drawnPaths.map(({ path, points, end }) => {
      const distance = Math.hypot(points.at(-1).x - points[0].x, points.at(-1).y - points[0].y);
      return {
        points, ready: end + 180,
        duration: Math.min(lightDraft ? 250 : 350, 120 + distance * 0.2),
        wipe: (duration) => animate(path, [{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }], { duration, fill: "forwards" })
      };
    });
    notes.forEach((n) => {
      const x = n.note.offsetLeft, y = n.note.offsetTop, width = n.note.offsetWidth, height = n.note.offsetHeight;
      const points = Array.from({ length: 17 }, (_, i) => ({ x: x + width * i / 16, y: y + height / 2 + Math.sin(i * 2.4) * 5 }));
      cleanup.push({ points, ready: n.end + 500, duration: 500, wipe: () => erase(n, false) });
    });
    cleanup.sort((a, b) => a.ready - b.ready).forEach((mark) => {
      const task = crew.reserve("eraser", mark.points, mark.ready, mark.duration);
      timers.push(schedule(() => mark.wipe(task.duration), task.start));
      mark.end = task.end;
    });
    const END = Math.max(DRAWN, ...cleanup.map((mark) => mark.end)) + 420;
    crew.play();
    const job = { finish: null };
    let done = false;
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      timers.forEach(clearTimeout);
      crew.cancel();
      reveals.forEach((animation) => animation.cancel());
      layer.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      layer.remove();
      parts.forEach((part) => { part.el.removeAttribute("data-draft-part"); part.el.classList.remove("is-drafted"); });
      running.delete(job);
    };
    job.finish = (now) => {
      if (closed || (done && !now)) return;
      done = true;
      if (now) timers.forEach(clearTimeout);
      parts.forEach((part) => fill(part, now));
      if (block.els[0] === hero) root.classList.remove("is-drafting");
      if (now) return close();
      // Keep the remaining cleanup crew alive until its final task is complete.
      timers.push(schedule(close, Math.max(0, END - DRAWN)));
    };
    timers.push(schedule(() => job.finish(false), DRAWN));
    running.add(job);
  };

  // A click or key press finishes whatever is drafting.
  const skip = () => running.forEach((job) => job.finish(true));
  addEventListener("pointerdown", skip);
  addEventListener("keydown", skip);
  addEventListener("resize", skip);
  motion.addEventListener("change", () => {
    if (!motion.matches) return;
    skip();
    pending.forEach((block) => block.parts.forEach((el) => el.removeAttribute("data-draft-part")));
    root.classList.remove("is-drafting");
  });

  // Measure once the type has loaded, or the outlines won't match the lines.
  const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
  Promise.all([fonts, Promise.race([readyTools, new Promise((resolve) => setTimeout(resolve, 1500))])]).then(async () => {
    const later = pending.filter((block) => block.els[0] !== hero);
    const opening = pending.find((block) => block.els[0] === hero);
    // All construction lines wait until the portrait finishes its first repositioning.
    // This also holds visible project blocks on short screens and section-link loads.
    if (root.classList.contains("is-awaiting-photo")) {
      await new Promise((resolve) => {
        const wait = new MutationObserver(() => {
          if (root.classList.contains("is-awaiting-photo")) return;
          wait.disconnect();
          resolve();
        });
        wait.observe(root, { attributes: true, attributeFilter: ["class"] });
      });
    }
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
