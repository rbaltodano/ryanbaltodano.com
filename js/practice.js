// Practice: a pinned figure that redraws for each step as the steps scroll past.
// Interface tests sparse solid/dashed editorial curves. The other scenes retain their
// stippled particle treatment for comparison. Reduced motion renders the finished scene.
(() => {
  const stage = document.querySelector(".practice__stage");
  const canvas = stage && stage.querySelector(".stage__canvas");
  const steps = [...document.querySelectorAll(".practice__steps .step")];
  if (!canvas || !steps.length) return;

  const W = 400, H = 300;                       // scene units; the stage is 4:3
  const INK = "247, 243, 235", MINT = "110, 220, 170";
  const NAMES = ["Interface", "Code", "Test", "Ship"];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Sampling ----------
  const NS = "http://www.w3.org/2000/svg";
  const scratch = document.createElementNS(NS, "svg");
  scratch.setAttribute("width", "0"); scratch.setAttribute("height", "0");
  scratch.style.position = "absolute"; scratch.style.visibility = "hidden";
  document.body.appendChild(scratch);

  function sample(d, spacing) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d); scratch.appendChild(p);
    const L = p.getTotalLength(), n = Math.max(1, Math.round(L / spacing)), pts = [];
    for (let i = 0; i <= n; i++) { const q = p.getPointAtLength((L * i) / n); pts.push([q.x, q.y]); }
    p.remove();
    return pts;
  }

  // A stroke: points plus how it looks and when it draws (s0 = start, span = how long it takes, both 0..1).
  function stroke(scene, src, o = {}) {
    const pts = typeof src === "string" ? sample(src, o.gap || 1.7) : src;
    const s0 = o.s0 || 0, span = o.span == null ? 0.25 : o.span;
    pts.forEach(([x, y], i) => scene.push({ x, y, r: o.r || 0.75, a: o.a == null ? 0.95 : o.a, c: o.c || INK, t: s0 + (span * i) / Math.max(1, pts.length - 1) }));
  }

  const rr = (x, y, w, h, r) => `M${x + r} ${y} h${w - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${h - 2 * r} a${r} ${r} 0 0 1 ${-r} ${r} h${-(w - 2 * r)} a${r} ${r} 0 0 1 ${-r} ${-r} v${-(h - 2 * r)} a${r} ${r} 0 0 1 ${r} ${-r}z`;
  const circ = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
  const ell = (cx, cy, rx, ry, steps = 90, rot = 0, a0 = 0, a1 = Math.PI * 2) => {
    const pts = [], c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i <= steps; i++) {
      const t = a0 + ((a1 - a0) * i) / steps, x = rx * Math.cos(t), y = ry * Math.sin(t);
      pts.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return pts;
  };
  // Seeded random, so every visit draws the same scene.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const specks = (scene, n, s0) => { for (let i = 0; i < n; i++) scene.push({ x: rnd() * W, y: rnd() * H, r: 0.6, a: 0.18 + rnd() * 0.25, c: INK, t: s0 + rnd() * 0.3 }); };

  // ---------- Scenes ----------
  function interfaceScene() {
    // One quiet contour and one point.
    return [
      { path: ell(200, 150, 66, 88, 180), a: 0.7, c: INK, dash: [], t: 0 },
      { x: 266, y: 150, r: 2.6, a: 1, c: MINT, t: 0 },
    ];
  }

  function codeScene() {
    const s = [];
    stroke(s, rr(80, 46, 240, 208, 10), { gap: 1.3, r: 0.85, span: 0.3 });           // window
    stroke(s, "M80 68h240", { s0: 0.1, span: 0.12 });
    [96, 108, 120].forEach((x, i) => stroke(s, circ(x, 57, 3.2), { gap: 1, s0: 0.12 + i * 0.02, span: 0.03 }));
    // Code: [indent, [length, mint?]...] per line, with line numbers beside.
    const rows = [[0, [22, 1], [48, 0]], [1, [18, 1], [30, 0], [24, 0]], [2, [64, 0]], [2, [28, 1], [40, 0]], [1, [12, 0]], [0],
      [0, [22, 1], [56, 0]], [1, [36, 0], [30, 0]], [2, [20, 1], [44, 0]], [1, [12, 0]]];
    rows.forEach(([ind, ...segs], i) => {
      const y = 86 + i * 12, t = 0.2 + i * 0.035;
      stroke(s, `M94 ${y}h4`, { a: 0.4, gap: 1.2, s0: t, span: 0.01 });
      let x = 108 + ind * 14;
      segs.forEach(([len, k]) => { stroke(s, `M${x} ${y}h${len}`, { c: k ? MINT : INK, a: k ? 0.95 : 0.75, gap: 1.5, s0: t, span: 0.05 }); x += len + 6; });
    });
    stroke(s, "M262 182v10", { c: MINT, gap: 1, s0: 0.6, span: 0.02 });               // cursor
    stroke(s, "M80 214h240", { s0: 0.55, span: 0.1, a: 0.6 });                        // terminal
    stroke(s, "M96 228 l6 5 l-6 5", { c: MINT, gap: 1, s0: 0.62, span: 0.03 });
    stroke(s, "M110 238h70", { s0: 0.64, span: 0.06, a: 0.75 });
    // Brackets either side, fanned outward like echoes.
    for (let k = 0; k < 9; k++) {
      const o = k * 5.5, a = 0.85 * (1 - k / 10), gap = 1.5 + k * 0.6, s0 = 0.3 + k * 0.05;
      stroke(s, `M${62 - o} ${92 - k * 7} L${22 - o * 1.4} 150 L${62 - o} ${208 + k * 7}`, { gap, a, s0, span: 0.25, r: 0.7 });
      stroke(s, `M${338 + o} ${92 - k * 7} L${378 + o * 1.4} 150 L${338 + o} ${208 + k * 7}`, { gap, a, s0, span: 0.25, r: 0.7 });
    }
    specks(s, 60, 0.7);
    return s;
  }

  function testScene() {
    const s = [];
    // Eighty cases, ten by eight: a filled dot for a pass, an open ring otherwise.
    seed = 11;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 10; c++) {
      const x = 40 + c * 14, y = 82 + r * 14, t = 0.05 + (r * 10 + c) * 0.006;
      if (rnd() < 0.86) s.push({ x, y, r: 1.9, a: 0.9, c: INK, t });
      else stroke(s, circ(x, y, 3.4), { gap: 1.1, a: 0.6, s0: t, span: 0.02 });
    }
    stroke(s, "M33 200h140", { a: 0.35, gap: 2.2, s0: 0.5, span: 0.1 });
    // Candidates as curves from a shared origin; the chosen one in mint.
    stroke(s, "M212 236h160", { gap: 1.6, s0: 0.15, span: 0.15 });
    stroke(s, "M212 236v-176", { gap: 1.6, s0: 0.15, span: 0.15 });
    for (let x = 228; x <= 372; x += 16) s.push({ x, y: 240, r: 0.7, a: 0.5, c: INK, t: 0.3 });
    for (let k = 8; k >= 1; k--) {
      const y = 76 + k * 15;
      stroke(s, `M212 236 C ${262 + k * 4} ${226 - k * 4}, ${300 - k * 3} ${y + 6}, 372 ${y}`, { gap: 2 + k * 0.45, a: 0.7 * (1 - k / 10), r: 0.65, s0: 0.35 + (8 - k) * 0.03, span: 0.3 });
    }
    stroke(s, "M212 236 C 262 228, 300 82, 372 72", { c: MINT, gap: 1.2, r: 0.85, s0: 0.62, span: 0.25 });
    stroke(s, circ(372, 72, 4.5), { c: MINT, gap: 0.9, s0: 0.86, span: 0.04 });
    specks(s, 50, 0.7);
    return s;
  }

  function shipScene() {
    const s = [];
    const cx = 196, cy = 168, R = 84;
    stroke(s, ell(cx, cy, R, R, 260), { r: 0.85, span: 0.3 });                       // globe
    [-60, -30, 0, 30, 60].forEach((lat, i) => {
      const rad = (lat * Math.PI) / 180, rx = R * Math.cos(rad);
      stroke(s, ell(cx, cy - R * Math.sin(rad), rx, rx * 0.26, Math.round(rx * 1.6)), { a: 0.45, r: 0.65, s0: 0.15 + i * 0.03, span: 0.2 });
    });
    [25, 55, 80].forEach((lon, i) => {
      const rx = R * Math.sin((lon * Math.PI) / 180);
      stroke(s, ell(cx, cy, rx, R, Math.round(R * 1.6)), { a: 0.35, r: 0.65, s0: 0.2 + i * 0.03, span: 0.2 });
    });
    // Trails sweeping round the globe, the flight itself in mint, ending at the plane.
    // The orbit runs behind the globe across the top, so dots there are hidden by it.
    const rot = -0.3, a0 = Math.PI * 0.8, a1 = Math.PI * 1.93;
    const orbit = (rx, ry, n, end) => ell(cx, cy, rx, ry, n, rot, a0, end).filter(([x, y], i, all) => {
      const t = a0 + ((end - a0) * i) / (all.length - 1);
      return !(Math.sin(t) < 0 && Math.hypot(x - cx, y - cy) < R + 2);
    });
    for (let k = 9; k >= 1; k--) stroke(s, orbit(150 + k * 5, 50 + k * 4, 120, a1 - k * 0.03), { a: 0.6 * (1 - k / 10), r: 0.6, s0: 0.35 + (9 - k) * 0.02, span: 0.35 });
    const full = ell(cx, cy, 150, 50, 160, rot, a0, a1);
    stroke(s, orbit(150, 50, 160, a1), { c: MINT, r: 0.85, s0: 0.45, span: 0.35 });
    const path = full;
    const [ex, ey] = path[path.length - 1], [px, py] = path[path.length - 3];
    const ang = Math.atan2(ey - py, ex - px), c = Math.cos(ang), sn = Math.sin(ang);
    const P = (x, y) => `${ex + x * c - y * sn} ${ey + x * sn + y * c}`;
    stroke(s, `M${P(12, 0)} L${P(-9, -8)} L${P(-4, 0)} L${P(-9, 8)} Z M${P(12, 0)} L${P(-4, 0)}`, { c: MINT, gap: 0.9, r: 0.8, s0: 0.82, span: 0.08 });
    specks(s, 90, 0.6);
    return s;
  }

  const builders = [interfaceScene, codeScene, testScene, shipScene];
  const scenes = [];
  const scene = (i) => scenes[i] || (scenes[i] = builders[i]());

  // ---------- Drawing ----------
  // One renderer per canvas: the pinned stage on desktop, and a figure under each step on phones.
  const DRAW_MS = 1700, OUT_MS = 260, FADE = 0.04;
  function figure(cv) {
    const ctx = cv.getContext("2d");
    let scale = 1, ox = 0, oy = 0, current = -1, started = 0, outgoing = null, raf = 0;

    function paintScene(dots, p, alpha) {
      for (const d of dots) {
        if (d.t > p) continue;
        if (d.path) {
          ctx.save();
          ctx.strokeStyle = `rgba(${d.c}, ${d.a * alpha * Math.min(1, p / 0.18)})`;
          ctx.lineWidth = 0.7 * scale;
          ctx.setLineDash(d.dash.map((v) => v * scale));
          ctx.beginPath();
          d.path.forEach(([x, y], i) => {
            const px = ox + x * scale, py = oy + y * scale;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          });
          ctx.stroke(); ctx.restore();
          continue;
        }
        const a = d.a * Math.min(1, (p - d.t) / FADE) * alpha;
        ctx.fillStyle = `rgba(${d.c}, ${a})`;
        ctx.beginPath(); ctx.arc(ox + d.x * scale, oy + d.y * scale, d.r * scale * 0.9, 0, Math.PI * 2); ctx.fill();
      }
    }
    function paint(now = performance.now()) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      let busy = false;
      if (outgoing) {
        const k = (now - outgoing.at) / OUT_MS;
        if (k < 1) { paintScene(scene(outgoing.i), 1.2, 1 - k); busy = true; } else outgoing = null;
      }
      if (current >= 0) {
        const delay = outgoing ? OUT_MS * 0.6 : 0;
        const p = (reduce || current === 0) ? 1.2 : Math.max(0, (now - started - delay) / DRAW_MS) * 1.2;
        paintScene(scene(current), p, 1);
        if (p < 1.2) busy = true;
      }
      raf = busy ? requestAnimationFrame(paint) : 0;
    }
    new ResizeObserver(() => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      scale = Math.min(r.width / W, r.height / H) * dpr;
      ox = (cv.width - W * scale) / 2; oy = (cv.height - H * scale) / 2 + 8 * dpr;
      if (!raf) paint();
    }).observe(cv);

    return {
      get current() { return current; },
      show(i) {
        if (i === current) return;
        if (current >= 0 && !reduce && i !== 0) outgoing = { i: current, at: performance.now() };
        else outgoing = null;
        current = i; started = performance.now();
        cv.parentElement.classList.toggle("stage--quiet", i === 0);
        if (!raf) raf = requestAnimationFrame(paint);
      },
    };
  }

  // Desktop: the pinned stage redraws for the step crossing the middle of the screen.
  const main = figure(canvas);
  const label = stage.querySelector("[data-stage-name]"), code = stage.querySelector(".stage__label .code"), ticks = stage.querySelectorAll(".stage__ticks i");
  function show(i) {
    if (i === main.current) return;
    main.show(i);
    label.textContent = NAMES[i]; code.textContent = `0${i + 1}`;
    ticks.forEach((t, k) => t.classList.toggle("is-on", k === i));
    steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
  }

  let seen = false;
  new IntersectionObserver((entries, io) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    seen = true; io.disconnect();
    if (main.current < 0) show(0);
  }, { rootMargin: "0px 0px -15% 0px" }).observe(stage);

  const band = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting && seen) show(Number(e.target.dataset.step));
  }), { rootMargin: "-50% 0px -50% 0px" });
  steps.forEach((s) => band.observe(s));

  // Phones: each step has its own figure under its text, drawn once as it scrolls into view.
  const inline = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.__figure.show(Number(e.target.dataset.scene));
    inline.unobserve(e.target);
  }), { rootMargin: "0px 0px -12% 0px" });
  document.querySelectorAll(".step__figure canvas").forEach((cv) => {
    cv.__figure = figure(cv);
    inline.observe(cv);
  });
})();
