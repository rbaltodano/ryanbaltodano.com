// Practice figures: labelled hairline diagrams that draw themselves in. Lines trace first,
// then small mono labels fade in. Reduced motion renders the finished diagram.
// Desktop: the steps scroll past one pinned figure that redraws for the step mid-screen.
// Phones: each step has its own figure under its text, drawn once as it scrolls in.
(() => {
  const canvases = document.querySelectorAll(".step__figure canvas");
  const pinned = document.querySelector(".practice__stage canvas");
  if (!canvases.length) return;

  const W = 400, H = 300;                       // scene units; the stage is 4:3
  const INK = "247, 243, 235", MINT = "110, 220, 170";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Shapes ----------
  // Every shape is a polyline in scene units.
  const seg = (x0, y0, x1, y1) => [[x0, y0], [x1, y1]];
  const poly = (...p) => p;
  const arc = (cx, cy, rx, ry, rot = 0, a0 = 0, a1 = Math.PI * 2, steps = 96) => {
    const pts = [], c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i <= steps; i++) {
      const t = a0 + ((a1 - a0) * i) / steps, x = rx * Math.cos(t), y = ry * Math.sin(t);
      pts.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return pts;
  };
  const at = (cx, cy, rx, ry, rot, t) => arc(cx, cy, rx, ry, rot, t, t, 1)[0];
  const rect = (x, y, w, h, r = 0) => {
    if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
    const q = Math.PI / 2;
    return [...arc(x + w - r, y + r, r, r, 0, -q, 0, 6), ...arc(x + w - r, y + h - r, r, r, 0, 0, q, 6),
      ...arc(x + r, y + h - r, r, r, 0, q, 2 * q, 6), ...arc(x + r, y + r, r, r, 0, 2 * q, 3 * q, 6), [x + w - r, y]];
  };
  const bez = (p0, p1, p2, p3, n = 60) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      pts.push([0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]));
    }
    return pts;
  };

  // ---------- Scene builder ----------
  // t = when an item starts drawing, d = how long it takes (both on a 0..1 timeline).
  function builder() {
    const items = [];
    const api = {
      items,
      line(pts, o = {}) { items.push({ kind: "line", pts, t: o.t || 0, d: o.d == null ? 0.25 : o.d, c: o.c || INK, a: o.a == null ? 0.55 : o.a, w: o.w || 1, dash: o.dash || null, fill: o.fill || false }); return api; },
      dot(x, y, r, o = {}) { items.push({ kind: "dot", x, y, r, t: o.t || 0, c: o.c || INK, a: o.a == null ? 1 : o.a, ring: o.ring || false }); return api; },
      // A label, with an optional leader from an anchor point to the text.
      label(text, x, y, o = {}) {
        const t = o.t == null ? 0.7 : o.t;
        if (o.from) {
          const [ax, ay] = o.from, center = o.align === "center";
          const ex = center ? x : o.align === "right" ? x + 4 : x - 4;
          const ey = center ? y + (ay > y ? 5 : -10) : y - 2.5;
          api.line(seg(ax, ay, ex, ey), { t: t - 0.12, d: 0.1, a: 0.3 });
          api.dot(ax, ay, 1.3, { t: t - 0.12, a: 0.8 });
        }
        items.push({ kind: "label", text, x, y, align: o.align || "left", t, c: o.c || INK, a: o.a == null ? 0.62 : o.a });
        return api;
      },
    };
    return api;
  }

  // ---------- Scenes ----------
  function interfaceScene() {
    const s = builder();
    // Alignment guides, like construction lines, then the phone.
    s.line(seg(162, 22, 162, 282), { dash: [2, 3], a: 0.22, d: 0.3 });
    s.line(seg(40, 90, 360, 90), { dash: [2, 3], a: 0.22, d: 0.3, t: 0.04 });
    s.line(rect(150, 34, 100, 232, 14), { a: 0.7, d: 0.35, t: 0.08 });
    s.line(seg(188, 44, 212, 44), { a: 0.5, t: 0.3, d: 0.05 });
    // Type: a title and a subtitle.
    s.line(seg(164, 62, 222, 62), { w: 2.4, a: 0.85, t: 0.3, d: 0.08 });
    s.line(seg(164, 74, 200, 74), { w: 1.2, a: 0.55, t: 0.34, d: 0.06 });
    // The component: a card with an image and two lines.
    s.line(rect(164, 94, 72, 52, 4), { a: 0.6, t: 0.36, d: 0.12 });
    s.line(arc(178, 110, 6, 6, 0, 0, Math.PI * 2, 24), { a: 0.5, t: 0.42, d: 0.05 });
    s.line(seg(172, 130, 214, 130), { a: 0.5, t: 0.44, d: 0.05 });
    s.line(seg(172, 137, 200, 137), { a: 0.35, t: 0.46, d: 0.04 });
    // A repeated pattern: three list rows.
    [168, 190, 212].forEach((y, i) => {
      const t = 0.42 + i * 0.04;
      s.line(arc(171, y, 4, 4, 0, 0, Math.PI * 2, 24), { a: 0.5, t, d: 0.04 });
      s.line(seg(181, y - 2, 228, y - 2), { a: 0.55, t, d: 0.05 });
      s.line(seg(181, y + 3, 208, y + 3), { a: 0.32, t, d: 0.04 });
    });
    s.line(seg(150, 240, 250, 240), { a: 0.35, t: 0.5, d: 0.08 });
    [178, 200, 222].forEach((x, i) => s.dot(x, 252, 1.6, { t: 0.55 + i * 0.02, a: i ? 0.45 : 0.9 }));
    // Selection on the component, with handles and a cursor.
    s.line(rect(160, 90, 80, 60), { c: MINT, a: 0.95, t: 0.58, d: 0.12 });
    [[160, 90], [240, 90], [160, 150], [240, 150]].forEach(([x, y]) => s.line(rect(x - 2.5, y - 2.5, 5, 5), { c: MINT, a: 1, t: 0.7, d: 0.02, fill: true }));
    s.line(poly([246, 156], [246, 172], [250.5, 167.5], [254, 175], [256.5, 174], [253, 166.5], [259, 166.5], [246, 156]), { c: MINT, a: 1, t: 0.72, d: 0.06, fill: true });
    s.label("Type scale", 120, 64, { align: "right", from: [162, 62] });
    s.label("Component", 280, 122, { from: [240, 120], t: 0.8 });
    s.label("Pattern", 120, 192, { align: "right", from: [165, 190], t: 0.85 });
    return s.items;
  }

  function codeScene() {
    const s = builder();
    s.line(rect(54, 36, 226, 228, 8), { a: 0.7, d: 0.35 });
    s.line(seg(54, 56, 280, 56), { a: 0.4, t: 0.12, d: 0.12 });
    [66, 76, 86].forEach((x, i) => s.line(arc(x, 46, 2.8, 2.8, 0, 0, Math.PI * 2, 20), { a: 0.5, t: 0.14 + i * 0.02, d: 0.03 }));
    s.line(seg(80, 56, 80, 264), { a: 0.18, t: 0.14, d: 0.2 });
    // Three blocks of code: [indent, [length, mint?]...] per row; null is a blank row.
    const rows = [
      [0, [26, 1], [40, 0]], [1, [20, 0], [34, 0]], [2, [52, 1]], [0, [10, 0]], null,
      [0, [30, 1], [24, 0], [30, 0]], [1, [44, 0]], [0, [12, 0]], null,
      [0, [16, 1], [50, 0]], [1, [26, 0], [30, 1]], [0, [10, 0]],
    ];
    rows.forEach((row, i) => {
      if (!row) return;
      const y = 72 + i * 15.5, t = 0.22 + i * 0.03;
      s.dot(70, y, 0.9, { a: 0.35, t });
      let x = 92 + row[0] * 14;
      row.slice(1).forEach(([len, k]) => { s.line(seg(x, y, x + len, y), { c: k ? MINT : INK, a: k ? 0.95 : 0.6, w: 1.4, t, d: 0.05 }); x += len + 6; });
    });
    s.line(seg(118, 238, 118, 250), { c: MINT, a: 1, w: 1.2, t: 0.62, d: 0.02 });
    // A bracket per block, each labelled with its stack.
    [[0, 3, "SwiftUI"], [5, 7, "React, TS"], [9, 11, "Rust"]].forEach(([r0, r1, name], i) => {
      const y0 = 72 + r0 * 15.5 - 5, y1 = 72 + r1 * 15.5 + 5, t = 0.6 + i * 0.06;
      s.line(poly([288, y0], [292, y0], [292, y1], [288, y1]), { a: 0.5, t, d: 0.06 });
      s.label(name, 308, (y0 + y1) / 2 + 2.5, { from: [292, (y0 + y1) / 2], t: t + 0.14 });
    });
    return s.items;
  }

  function testScene() {
    const s = builder();
    // Eighty cases, ten by eight: a filled dot for a pass, an open ring otherwise. Seeded, so it never changes.
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 10; c++) {
      const x = 36 + c * 13, y = 98 + r * 13, t = 0.04 + (r * 10 + c) * 0.005;
      if (rnd() < 0.86) s.dot(x, y, 1.9, { a: 0.85, t });
      else s.dot(x, y, 3, { ring: true, a: 0.6, t });
    }
    s.line(poly([33, 88], [33, 84], [156, 84], [156, 88]), { a: 0.45, t: 0.45, d: 0.08 });
    s.label("80 cases", 94, 72, { align: "center", t: 0.6 });
    // Candidates rising from a shared origin; the chosen one in mint.
    s.line(seg(196, 236, 372, 236), { a: 0.6, t: 0.1, d: 0.15 });
    s.line(seg(196, 236, 196, 70), { a: 0.6, t: 0.1, d: 0.15 });
    for (let x = 216; x <= 372; x += 20) s.line(seg(x, 236, x, 240), { a: 0.4, t: 0.25, d: 0.02 });
    for (let k = 6; k >= 1; k--) {
      const y = 92 + k * 18;
      s.line(bez([196, 236], [236 + k * 6, 226 - k * 4], [300 - k * 4, y + 6], [366, y]), { a: 0.32, t: 0.3 + (6 - k) * 0.03, d: 0.25 });
    }
    s.line(bez([196, 236], [236, 228], [290, 92], [366, 84]), { c: MINT, a: 1, w: 1.3, t: 0.55, d: 0.25 });
    s.line(arc(366, 84, 4.5, 4.5, 0, 0, Math.PI * 2, 24), { c: MINT, a: 1, t: 0.8, d: 0.04 });
    s.label("Default", 366, 62, { align: "center", from: [366, 79], t: 0.88 });
    s.label("Candidates", 284, 258, { align: "center", t: 0.75, a: 0.45 });
    return s.items;
  }

  function shipScene() {
    const s = builder();
    const cx = 196, cy = 156;
    // Plane of reference and a reference direction, then two orbits: iPhone now, Mac next.
    s.line(arc(cx, cy, 158, 38), { a: 0.25, d: 0.35 });
    s.line(seg(cx, cy, 352, cy), { dash: [2, 3], a: 0.4, t: 0.2, d: 0.15 });
    s.line(poly([347, cy - 3], [353, cy], [347, cy + 3]), { a: 0.5, t: 0.34, d: 0.03 });
    const rotA = -0.62, rotB = 0.42;
    s.line(arc(cx, cy, 128, 58, rotA), { a: 0.6, t: 0.12, d: 0.4 });
    s.line(arc(cx, cy, 92, 34, rotB), { a: 0.45, dash: [3, 3], t: 0.22, d: 0.35 });
    s.dot(cx, cy, 5.5, { t: 0.05 });
    // Angrove on iPhone: the flight in mint along its orbit, ending at the plane.
    const tA = -1.25, path = arc(cx, cy, 128, 58, rotA, tA - 1.1, tA, 40);
    s.line(path, { c: MINT, a: 1, w: 1.3, t: 0.5, d: 0.18 });
    const [ex, ey] = path[path.length - 1], [px, py] = path[path.length - 3];
    const ang = Math.atan2(ey - py, ex - px), c = Math.cos(ang), sn = Math.sin(ang);
    const P = (x, y) => [ex + x * c - y * sn, ey + x * sn + y * c];
    s.line(poly(P(9, 0), P(-7, -6), P(-3, 0), P(-7, 6), P(9, 0)), { c: MINT, a: 1, t: 0.68, d: 0.04, fill: true });
    s.line(seg(cx, cy, ex, ey), { a: 0.4, t: 0.62, d: 0.08 });
    // The angle between the reference direction and the plane.
    s.line(arc(cx, cy, 24, 24, 0, Math.atan2(ey - cy, ex - cx), 0, 24), { a: 0.5, t: 0.66, d: 0.06 });
    // Mac, still to launch: an open marker on its dashed orbit.
    const [mx, my] = at(cx, cy, 92, 34, rotB, 0.3);
    s.dot(mx, my, 3.4, { ring: true, a: 0.9, t: 0.6 });
    s.label("TestFlight", ex - 14, ey - 4, { align: "right", t: 0.78 });
    s.label("Mac, Dec 15", 318, 262, { align: "center", from: [mx, my], t: 0.84 });
    return s.items;
  }

  const builders = [interfaceScene, codeScene, testScene, shipScene];
  const scenes = [];
  const scene = (i) => scenes[i] || (scenes[i] = builders[i]().map(prep));
  // Running lengths, so a line can be drawn partway.
  function prep(it) {
    if (it.kind !== "line") return it;
    let L = 0; it.cum = [0];
    for (let i = 1; i < it.pts.length; i++) { L += Math.hypot(it.pts[i][0] - it.pts[i - 1][0], it.pts[i][1] - it.pts[i - 1][1]); it.cum.push(L); }
    it.len = L;
    return it;
  }

  // ---------- Drawing ----------
  const DRAW_MS = 2000, OUT_MS = 260, END = 1.1;
  const ease = (k) => 1 - Math.pow(1 - k, 3);
  function figure(cv) {
    const ctx = cv.getContext("2d");
    let scale = 1, ox = 0, oy = 0, dpr = 1, current = -1, started = 0, raf = 0, outgoing = null;
    const X = (x) => ox + x * scale, Y = (y) => oy + y * scale;

    function paintScene(items, p) {
      const hair = Math.max(0.75 * dpr, 0.6 * scale);
      for (const it of items) {
        if (it.t > p) continue;
        if (it.kind === "line") {
          const k = it.d ? ease(Math.min(1, (p - it.t) / it.d)) : 1, stop = it.len * k;
          ctx.strokeStyle = ctx.fillStyle = `rgba(${it.c}, ${it.a})`;
          ctx.lineWidth = hair * it.w;
          ctx.setLineDash(it.dash ? it.dash.map((v) => v * scale) : []);
          ctx.beginPath(); ctx.moveTo(X(it.pts[0][0]), Y(it.pts[0][1]));
          for (let i = 1; i < it.pts.length; i++) {
            if (it.cum[i] <= stop) { ctx.lineTo(X(it.pts[i][0]), Y(it.pts[i][1])); continue; }
            const [ax, ay] = it.pts[i - 1], [bx, by] = it.pts[i], f = (stop - it.cum[i - 1]) / (it.cum[i] - it.cum[i - 1] || 1);
            ctx.lineTo(X(ax + (bx - ax) * f), Y(ay + (by - ay) * f));
            break;
          }
          if (it.fill && k >= 1) ctx.fill(); else ctx.stroke();
        } else if (it.kind === "dot") {
          const k = ease(Math.min(1, (p - it.t) / 0.05));
          ctx.beginPath(); ctx.arc(X(it.x), Y(it.y), it.r * scale * (0.4 + 0.6 * k), 0, Math.PI * 2);
          if (it.ring) { ctx.setLineDash([]); ctx.lineWidth = hair; ctx.strokeStyle = `rgba(${it.c}, ${it.a * k})`; ctx.stroke(); }
          else { ctx.fillStyle = `rgba(${it.c}, ${it.a * k})`; ctx.fill(); }
        } else {
          const k = Math.min(1, (p - it.t) / 0.08);
          ctx.font = `400 ${Math.max(7 * scale, 9 * dpr)}px "Martian Mono", ui-monospace, monospace`;
          ctx.textAlign = it.align; ctx.textBaseline = "alphabetic";
          ctx.fillStyle = `rgba(${it.c}, ${it.a * k})`;
          ctx.fillText(it.text, X(it.x), Y(it.y) + (1 - k) * 3 * dpr);
        }
      }
    }
    function paint(now = performance.now()) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (current < 0) { raf = 0; return; }
      // The previous scene fades out while the next one starts drawing.
      let fading = false;
      if (outgoing) {
        const k = (now - outgoing.at) / OUT_MS;
        if (k < 1) { ctx.globalAlpha = 1 - k; paintScene(scene(outgoing.i), END); ctx.globalAlpha = 1; fading = true; } else outgoing = null;
      }
      const p = reduce ? END : Math.max(0, (now - started) / DRAW_MS) * END;
      paintScene(scene(current), p);
      raf = p < END || fading ? requestAnimationFrame(paint) : 0;
    }
    new ResizeObserver(() => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      scale = Math.min(r.width / W, r.height / H) * dpr;
      ox = (cv.width - W * scale) / 2; oy = (cv.height - H * scale) / 2;
      if (!raf) paint();
    }).observe(cv);
    // Labels use the web font; repaint once it has loaded.
    if (document.fonts) document.fonts.ready.then(() => { if (!raf) paint(); });

    return {
      show(i) {
        if (i === current) return;
        const now = performance.now();
        outgoing = current >= 0 && !reduce ? { i: current, at: now } : null;
        current = i; started = outgoing ? now + OUT_MS * 0.5 : now;
        if (!raf) raf = requestAnimationFrame(paint);
      },
    };
  }

  // Desktop: the step crossing the middle of the screen is active, and the pinned figure follows it.
  if (pinned) {
    const stage = figure(pinned), steps = [...document.querySelectorAll(".step")];
    const label = document.querySelector(".stage__label"), ticks = document.querySelectorAll(".stage__ticks i");
    const activate = (i) => {
      steps.forEach((el, k) => el.classList.toggle("is-active", k === i));
      ticks.forEach((el, k) => el.classList.toggle("is-on", k === i));
      label.querySelector(".code").textContent = String(i + 1).padStart(2, "0");
      label.querySelector(".stage__name").textContent = steps[i].querySelector(".eyebrow").lastChild.textContent;
      if (pinned.offsetParent) stage.show(i);
    };
    const mid = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) activate(steps.indexOf(e.target));
    }), { rootMargin: "-50% 0px -50% 0px" });
    steps.forEach((el) => mid.observe(el));
    // The first step is active before any scrolling, so the figure has something to draw.
    const first = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      if (!steps.some((el) => el.classList.contains("is-active"))) activate(0);
      first.disconnect();
    }, { rootMargin: "0px 0px -12% 0px" });
    first.observe(pinned);
  }

  // Phones: each figure draws once, as it scrolls into view.
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.__figure.show(Number(e.target.dataset.scene));
    io.unobserve(e.target);
  }), { rootMargin: "0px 0px -12% 0px" });
  canvases.forEach((cv) => {
    cv.__figure = figure(cv);
    io.observe(cv);
  });
})();
