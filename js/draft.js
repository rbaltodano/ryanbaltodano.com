// Each part of the page starts as a layout sketch before it is inked. Hand-ruled
// construction guides run along the block's edges and top; headings, stamps, and buttons get
// boxes, images crossed boxes, and running text lettering guidelines, all in graphite; pencil
// notes on the design choices are written beside them (from data-draft-note). Then each piece fills in reading
// order, with pens filling the sketch; erasers clear the temporary
// graphite as each mark is finished. The opening drafts on load, every later block the first time it
// scrolls into view. It runs on each page load. A click or key finishes it at once.
// Without JavaScript or with reduced motion, nothing is held back.
(() => {
  const root = document.documentElement;
  const casePage = document.querySelector(".case");
  if (!root.classList.contains("is-drafting") && (!casePage || matchMedia("(prefers-reduced-motion: reduce)").matches)) return;

  const SVG = "http://www.w3.org/2000/svg";
  const EASE = "cubic-bezier(0.55, 0, 0.17, 1)";
  // One speed multiplier keeps tools, marks, writing and cleanup on the same clock.
  const PACE = 1.6;
  const introSpeed = Number(root.dataset.introSpeed) || 1;
  const animate = (element, frames, options) => {
    const pace = PACE * (element.closest('.hero, .draft[data-stage="opening"]') ? introSpeed : 1);
    return element.animate(frames, {
      ...options, duration: options.duration / pace, delay: (options.delay || 0) / pace
    });
  };
  const lightDraft = matchMedia("(max-width: 48rem), (pointer: coarse)").matches;
  const ERASER_PASSES = lightDraft ? 1 : 2;
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
  const crewFor = (layer, inProgress = false, pencilCount = 3) => {
    const workers = {};
    const motions = [];
    let built = false;
    const reserve = (kind, points, earliest, duration) => {
      const pool = workers[kind] ||= Array.from({ length: kind === "pencil" ? pencilCount : lightDraft || kind === "eraser" ? 1 : 2 }, () => ({ free: 0, jobs: [] }));
      const worker = pool.reduce((a, b) => a.free <= b.free ? a : b);
      const approach = inProgress ? 0 : lightDraft ? 110 : 160;
      const start = Math.max(earliest, worker.free) + approach;
      const end = start + duration;
      worker.jobs.push({ points, start, end, approach });
      worker.free = end + 55;
      return { start, end, duration };
    };
    const prepare = () => {
      if (built) return;
      built = true;
      Object.entries(workers).forEach(([kind, pool]) => pool.forEach((worker) => {
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
        const entry = previous || (inProgress ? first : { x: first.x - 42, y: first.y + 45 });
        if (!previous) frame(0, entry, inProgress ? 1 : 0, angle - 8);
        frame(job.start - job.approach, entry, previous || inProgress ? 1 : 0, angle - 8);
        frame(job.start, first, 1, angle);
        job.points.slice(1).forEach((point, i) => frame(job.start + (job.end - job.start) * (i + 1) / (job.points.length - 1), point, 1, angle + (kind === "eraser" ? Math.sin(i * 2.4) * 7 : Math.sin(i) * 2)));
        previous = last;
      });
      frame(worker.free, previous, 1, kind === "pencil" ? 155 : -25);
      frame(total, { x: previous.x + 45, y: previous.y - 55 }, 0, kind === "pencil" ? 145 : -35);
      const animation = animate(tool, frames, { duration: total, fill: "forwards" });
      animation.pause();
      animation.currentTime = 0;
      motions.push(animation);
    }));
    };
    const play = () => { prepare(); motions.forEach((animation) => animation.play()); };
    return { reserve, prepare, play, cancel: () => motions.forEach((animation) => animation.cancel()) };
  };
  const PARTS = "h1, h2, h3, h4, p, dt, dd, figcaption, img, video, .button, .hero__actions > a, .contact__email, blockquote footer";
  const SKIP = ".desk, .hero__clip, .contact__clip, .hero__portrait img, .hero__portrait figcaption, .contact__photo img, .contact__photo figcaption, .margin-note, .scribble, .visually-hidden, [hidden], .draft";
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
  if (casePage) [...casePage.children].filter((el) => el.matches(".case__opening, .case__figure, .case__section")).forEach((el) => blocks.push([el]));

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
    if (first) block.parts.forEach((el) => el.setAttribute("data-draft-part", outlined(el) ? "outline" : ""));
    return true;
  });

  const running = new Set();
  const prepared = new Set();
  // A block that fails to draft simply shows; nothing stays held back.
  const draft = (block) => {
    if (motion.matches) {
      block.parts.forEach((el) => el.removeAttribute("data-draft-part"));
      return;
    }
    try { if (block.job) block.job.start(); else drawBlock(block); }
    catch (e) { block.parts.forEach((el) => el.removeAttribute("data-draft-part")); if (block.els[0] === hero) root.classList.remove("is-drafting"); }
  };
  let serial = 0;
  const drawBlock = (block) => {
    const finishing = block.els[0] !== hero;
    const pace = PACE * (finishing ? 1 : introSpeed);
    const schedule = (callback, delay) => setTimeout(callback, delay / pace);
    const experience = block.els.some((el) => el.matches(".record__roles"));
    const settled = finishing ? block.els.flatMap((el) => [...(el.matches("[data-settle], [data-stamp], [data-rise]") ? [el] : []), ...el.querySelectorAll("[data-settle], [data-stamp], [data-rise]")]) : [];
    if (finishing) {
      // Settle the real content before measuring its already-built structure.
      [...block.parts, ...settled].forEach((el) => el.classList.add("is-draft-ready", "is-in"));
      block.parts.forEach((el) => el.classList.add("is-drafted", "is-inked"));
    }
    const rects = block.els.map((el) => el.getBoundingClientRect());
    const left = Math.min(...rects.map((r) => r.left)), top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right)), bottom = Math.max(...rects.map((r) => r.bottom));
    const w = right - left, h = bottom - top;
    const layer = document.createElement("div");
    layer.className = "draft";
    layer.dataset.stage = finishing ? "finishing" : "opening";
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
    const crew = crewFor(layer, finishing, experience ? 3 : undefined);
    const drawnPaths = [];
    const outlineAnimations = [];
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
      if (finishing) {
        path.style.strokeDashoffset = "0";
        drawnPaths.push({ path, points, end: 0 });
      } else {
        // The hero keeps the full pencil trace before its content inks in.
        const task = crew.reserve("pencil", points, delay, Math.min(lightDraft ? 220 : 300, 110 + len * 0.18));
        outlineAnimations.push(animate(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: task.duration, delay: task.start, easing: "linear", fill: "backwards" }));
        drawnPaths.push({ path, points, end: task.end });
      }
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
    if (!finishing) {
      rule(padL, 0, padL, h, 0, "draft__guide", 0, 620);
      rule(w - padR, 0, w - padR, h, 80, "draft__guide", 0, 620);
      rule(0, firstTop, w, firstTop, 160, "draft__guide", 0, 620);
    }

    // Outlines in reading order: headings stay as outlined letters (set by CSS); images get
    // crossed boxes, as in a layout sketch; stamps, buttons, and the address get boxes; running
    // text gets lettering guidelines.
    let delay = 120;
    const step = Math.max(24, Math.min(55, 520 / Math.max(1, block.parts.length)));
    const reveals = [];
    const parts = block.parts.map((el) => {
      const marks = [];
      if (finishing) return { el, marks, done: false };
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

    if (finishing) {
      // Prepare the already-composed page while it is still offscreen. Nothing
      // fades from a blank section when the observer later starts the last beat.
      const restore = [];
      const select = (selector) => block.els.flatMap((el) => [...(el.matches(selector) ? [el] : []), ...el.querySelectorAll(selector)]);
      const rememberStyle = (el, property, value) => {
        const previous = el.style.getPropertyValue(property), priority = el.style.getPropertyPriority(property);
        el.style.setProperty(property, value);
        restore.push(() => { if (previous) el.style.setProperty(property, previous, priority); else el.style.removeProperty(property); });
      };
      const detail = (x1, y1, x2, y2, color, temporary = false) => {
        const path = rule(x1, y1, x2, y2, 0, temporary ? "draft__guide" : "draft__accent", 0);
        if (!path) return null;
        path.style.stroke = color;
        const mark = drawnPaths.at(-1);
        mark.temporary = temporary;
        return mark;
      };
      // Follow actual divider and accent rules, never the lines of body text.
      select(".specimen, .notes-grid, .project__pull, .roles, .role, .case details, .case__facts > div").filter((el) => (!experience || el.matches(".roles")) && el.getClientRects().length && !el.closest("details:not([open])")).slice(0, 4).forEach((el) => {
        const style = getComputedStyle(el), r = at(el.getBoundingClientRect());
        const edge = parseFloat(style.borderTopWidth) > 0 ? "top" : parseFloat(style.borderBottomWidth) > 0 ? "bottom" : null;
        if (!edge) return;
        const color = edge === "top" ? style.borderTopColor : style.borderBottomColor;
        const mark = detail(r.x, edge === "top" ? r.y : r.y + r.h, r.x + r.w, edge === "top" ? r.y : r.y + r.h, color);
        if (mark) rememberStyle(el, `border-${edge}-color`, "transparent");
      });
      select(".scrawl, .text-link").filter((el) => el.getClientRects().length).slice(0, 2).forEach((el) => {
        const r = at(el.getBoundingClientRect()), style = getComputedStyle(el);
        const mark = detail(r.x, r.y + r.h - 1, r.x + r.w, r.y + r.h - 1, el.matches(".scrawl") ? getComputedStyle(root).getPropertyValue("--accent").trim() : style.borderBottomColor);
        if (!mark) return;
        if (el.matches(".scrawl")) { el.classList.add("is-pencil-underline"); restore.push(() => el.classList.remove("is-pencil-underline")); }
        else rememberStyle(el, "border-bottom-color", "transparent");
      });
      select(".case__section > h2").forEach((el) => {
        const r = at(el.getBoundingClientRect());
        const mark = detail(r.x, r.y + r.h + 8, r.x + 72, r.y + r.h + 8, getComputedStyle(root).getPropertyValue("--accent").trim());
        if (mark) { el.classList.add("is-pencil-underline"); restore.push(() => el.classList.remove("is-pencil-underline")); }
      });
      // Existing handwritten messages stay as real text; the pencil completes
      // their last words, instead of drawing lettering guides across paragraphs.
      select(".margin-note").filter((el) => el.getClientRects().length).slice(0, 2).forEach((note) => {
        note.classList.add("is-written");
        const text = note.querySelector(":scope > span");
        if (!text) return;
        const lines = rows(text), row = lines.at(-1);
        if (!row) return;
        const mark = detail(row.left - left, row.top - top + row.height * 0.75, row.right - left, row.top - top + row.height * 0.75, "transparent");
        if (mark) { mark.message = text; rememberStyle(text, "transition", "none"); }
      });
      // Explicit writing targets keep each passage tied to its own pencil.
      select("[data-pencil-write]").filter((el) => el.getClientRects().length).forEach((el) => {
        const lines = rows(el), r = at(el.getBoundingClientRect());
        if (!lines.length) return;
        const points = lines.flatMap((row) => [
          { x: row.left - left, y: row.top - top + row.height * 0.75 },
          { x: row.right - left, y: row.top - top + row.height * 0.75 }
        ]);
        const mark = detail(points[0].x, points[0].y, points.at(-1).x, points.at(-1).y, "transparent");
        if (!mark) return;
        const frames = lines.flatMap((row, index) => {
          const lineTop = index ? (row.top - top - r.y) / r.h * 100 : -12;
          const lineBottom = index === lines.length - 1 ? 112 : (lines[index + 1].top - top - r.y) / r.h * 100;
          return [0, 1].map((edge) => {
            const x = (row[edge ? "right" : "left"] - left - r.x) / r.w * 100 + (edge ? 1 : -1);
            return { offset: (index * 2 + edge) / (lines.length * 2 - 1), clipPath: `polygon(-2% -12%, 102% -12%, 102% ${lineTop}%, ${x}% ${lineTop}%, ${x}% ${lineBottom}%, -2% ${lineBottom}%)` };
          });
        });
        mark.write = { el, points, frames };
        rememberStyle(el, "transition", "none");
        rememberStyle(el, "clip-path", frames[0].clipPath);
      });
      select("[data-pencil-scribble]").forEach((el) => {
        const points = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          for (let i = 0; i < node.length; i++) {
            if (!node.textContent[i].trim()) continue;
            const range = document.createRange();
            range.setStart(node, i); range.setEnd(node, i + 1);
            const r = at(range.getBoundingClientRect());
            for (let stroke = 0; stroke < 8; stroke++) points.push({ x: r.x + r.w * (0.15 + stroke / 7 * 0.7), y: r.y + r.h * (stroke % 2 ? 0.74 : 0.3) });
          }
        }
        if (points.length < 2) return;
        const mark = detail(points[0].x, points[0].y, points.at(-1).x, points.at(-1).y, getComputedStyle(root).getPropertyValue("--draft").trim());
        if (!mark) return;
        mark.path.setAttribute("d", points.map((point, i) => `${i ? "L" : "M"}${point.x} ${point.y}`).join(" "));
        mark.path.style.strokeDashoffset = "1";
        mark.path.style.opacity = "0"; // Motion guide only; no marks behind the wordmark.
        mark.scribble = points;
      });
      // Short registration corners around captures/photos, without crossing
      // through the picture or drawing a full box around every element.
      select("figure.film, figure.snapshot").filter((el) => !el.closest(".hero") && el.getClientRects().length).slice(0, 2).forEach((figure) => {
        const media = figure.querySelector("img, video"), r = at((media || figure).getBoundingClientRect());
        const color = getComputedStyle(root).getPropertyValue("--draft").trim();
        detail(r.x - 8, r.y + 18, r.x - 8, r.y - 8, color, true);
        detail(r.x - 8, r.y - 8, r.x + 22, r.y - 8, color, true);
        detail(r.x + r.w - 22, r.y + r.h + 8, r.x + r.w + 8, r.y + r.h + 8, color, true);
      });
      const remainingPaths = drawnPaths;
      const groups = [drawnPaths.filter((mark) => mark.message || mark.write || mark.scribble), drawnPaths.filter((mark) => !mark.message && !mark.write && !mark.scribble && !mark.temporary), drawnPaths.filter((mark) => mark.temporary)];
      const finishingPaths = [];
      while (groups.some((group) => group.length) && finishingPaths.length < 8) {
        groups.forEach((group) => { if (group.length && finishingPaths.length < 8) finishingPaths.push(group.shift()); });
      }
      const jobs = [];
      const animations = [];
      const timers = [];
      finishingPaths.forEach((mark, i) => {
        if (mark.scribble) {
          const task = crew.reserve("pencil", mark.scribble, i * 90, 1800);
          jobs.push({ task, run: () => animate(mark.path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: task.duration, fill: "forwards" }) });
          return;
        }
        if (mark.write) {
          const { el, points, frames } = mark.write;
          const task = crew.reserve("pencil", points, i * 90, el.matches(".role__about") ? 2400 : 1400);
          mark.finishAt = task.end;
          jobs.push({ task, run: () => animate(el, frames, { duration: task.duration, fill: "forwards" }) });
          return;
        }
        mark.path.style.strokeDashoffset = "0.3";
        const before = mark.points[11], after = mark.points[12];
        const from = { x: before.x + (after.x - before.x) * 0.2, y: before.y + (after.y - before.y) * 0.2 };
        const task = crew.reserve("pencil", [from, ...mark.points.slice(12)], i * 90, 850);
        mark.finishAt = task.end;
        if (mark.message) rememberStyle(mark.message, "clip-path", "inset(-20% 30% -30% -4%)");
        jobs.push({ task, run: () => {
          if (mark.message) animations.push(animate(mark.message, [{ clipPath: "inset(-20% 30% -30% -4%)" }, { clipPath: "inset(-20% -4% -30% -4%)" }], { duration: task.duration, fill: "forwards" }));
          return animate(mark.path, [{ strokeDashoffset: 0.3 }, { strokeDashoffset: 0 }], { duration: task.duration, fill: "forwards" });
        } });
      });
      remainingPaths.filter((mark) => mark.temporary).forEach((mark, i) => {
        const start = mark.finishAt ? mark.finishAt + 80 : 0;
        if (i < (lightDraft ? 3 : 5)) {
          const task = crew.reserve("eraser", mark.points, start, 560);
          jobs.push({ task, run: () => animate(mark.path, [{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }], { duration: task.duration, fill: "forwards" }) });
        } else {
          // Unselected guides lift quietly; the eraser only visits a few marks.
          const task = { start: start + 180, end: start + 420, duration: 240 };
          jobs.push({ task, run: () => animate(mark.path, [{ opacity: getComputedStyle(mark.path).opacity }, { opacity: 0 }], { duration: task.duration, fill: "forwards" }) });
        }
      });
      let started = false, closed = false;
      const job = {
        start: () => {
          if (started || closed) return;
          started = true;
          running.add(job);
          jobs.forEach(({ task, run }) => {
            if (!task.start) animations.push(run());
            else timers.push(schedule(() => animations.push(run()), task.start));
          });
          crew.play();
          timers.push(schedule(() => job.finish(), Math.max(0, ...jobs.map(({ task }) => task.end)) + 420));
        },
        finish: () => {
          if (closed) return;
          closed = true;
          timers.forEach(clearTimeout);
          animations.forEach((animation) => animation.cancel());
          crew.cancel();
          layer.remove();
          restore.forEach((reset) => reset());
          [...block.parts, ...settled].forEach((el) => el.classList.remove("is-draft-ready"));
          parts.forEach(({ el }) => { el.removeAttribute("data-draft-part"); el.classList.remove("is-drafted"); });
          running.delete(job);
          prepared.delete(job);
        }
      };
      // Place the stationary crew with the section, before it enters view.
      // Only its clock starts at the intersection; there is no entrance reveal.
      crew.prepare();
      prepared.add(job);
      return job;
    }

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

    // Ink the existing sketch immediately, with erasers trailing the fill.
    parts.forEach((part, i) => {
      const r = at(part.el.getBoundingClientRect());
      const dependencies = drawnPaths.filter(({ path }) => part.marks.some((mark) => mark === path || mark.contains(path)));
      const earliest = Math.max(320 + i * 45, ...dependencies.map((mark) => mark.end));
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
    const DRAWN = Math.max(0, ...drawnPaths.map((mark) => mark.end), ...parts.map((p) => p.task.end), ...notes.map((n) => n.end)) + 100;
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
    // Keep each outline until its content starts filling, then clear it while
    // the rest of the block continues. Only temporary graphite is erased.
    const cleanup = drawnPaths.map(({ path, points, end }) => {
      const owner = parts.find((part) => part.marks.some((mark) => mark === path || mark.contains(path)));
      const distance = Math.hypot(points.at(-1).x - points[0].x, points.at(-1).y - points[0].y);
      return {
        points, ready: Math.max(end, owner ? owner.task.start : 320) + 180,
        duration: Math.min(lightDraft ? 250 : 350, 120 + distance * 0.2),
        wipe: (duration) => animate(path, [{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }], { duration, fill: "forwards" }),
        lift: (duration) => animate(path, [{ opacity: getComputedStyle(path).opacity }, { opacity: 0 }], { duration, fill: "forwards" })
      };
    });
    notes.forEach((n) => {
      const x = n.note.offsetLeft, y = n.note.offsetTop, width = n.note.offsetWidth, height = n.note.offsetHeight;
      const points = Array.from({ length: 17 }, (_, i) => ({ x: x + width * i / 16, y: y + height / 2 + Math.sin(i * 2.4) * 5 }));
      cleanup.push({ points, ready: n.end + 500, duration: 500, wipe: () => erase(n, false), lift: (duration) => animate(n.note, [{ opacity: 1 }, { opacity: 0 }], { duration, fill: "forwards" }) });
    });
    cleanup.sort((a, b) => a.ready - b.ready).forEach((mark, i) => {
      const task = i < ERASER_PASSES
        ? crew.reserve("eraser", mark.points, mark.ready, mark.duration)
        : { start: mark.ready, end: mark.ready + mark.duration, duration: mark.duration };
      timers.push(schedule(() => (i < ERASER_PASSES ? mark.wipe : mark.lift)(task.duration), task.start));
      mark.end = task.end;
    });
    const END = Math.max(DRAWN, ...cleanup.map((mark) => mark.end)) + 420;
    crew.play();
    if (!finishing && outlineAnimations.length) {
      // Share the actual animation clock, including the drawing pace and tool
      // approach delays, so the portrait can follow the construction strokes.
      Promise.all(outlineAnimations.map(animation => animation.ready)).then(() => {
        const times = outlineAnimations.map(animation => {
          const timing = animation.effect.getTiming();
          const start = animation.startTime + timing.delay;
          return { start, end: start + timing.duration };
        });
        hero.dispatchEvent(new CustomEvent("hero-outline-timeline", { detail: {
          start: Math.min(...times.map(time => time.start)),
          end: Math.max(...times.map(time => time.end))
        } }));
      }).catch(() => {});
    }
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
  addEventListener("resize", () => { skip(); prepared.forEach((job) => job.finish()); });
  motion.addEventListener("change", () => {
    if (!motion.matches) return;
    skip();
    prepared.forEach((job) => job.finish());
    pending.forEach((block) => block.parts.forEach((el) => el.removeAttribute("data-draft-part")));
    root.classList.remove("is-drafting");
  });

  // Measure once the type has loaded, or the outlines won't match the lines.
  const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
  Promise.all([fonts, Promise.race([readyTools, new Promise((resolve) => setTimeout(resolve, 1500))])]).then(async () => {
    if (motion.matches) {
      pending.forEach((block) => block.parts.forEach((el) => el.removeAttribute("data-draft-part")));
      root.classList.remove("is-drafting");
      return;
    }
    const later = pending.filter((block) => block.els[0] !== hero);
    const opening = pending.find((block) => block.els[0] === hero);
    // Build static structure before it enters view, rather than revealing the
    // sketch and replaying the whole construction sequence on arrival.
    later.forEach((block) => {
      try { block.job = drawBlock(block); }
      catch { block.parts.forEach((el) => el.removeAttribute("data-draft-part")); }
    });
    // All construction lines wait until the portrait finishes its entrance slide.
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
    if (!("IntersectionObserver" in window)) return prepared.forEach((job) => job.finish());
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const block = later.find((b) => b.els[0] === entry.target);
      io.unobserve(entry.target);
      if (block) draft(block);
    }), { rootMargin: "0px 0px -22% 0px" });
    later.forEach((block) => io.observe(block.els[0]));
  });
})();
