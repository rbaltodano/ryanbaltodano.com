// Mathematical figures — plotted from the real functions (see DESIGN.md §5).
// Each <figure data-plot="name"> holds an empty <svg viewBox>; this fills it.

const NS = "http://www.w3.org/2000/svg";
const PI = Math.PI;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function el(parent, tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text != null) node.textContent = text;
  parent.appendChild(node);
  return node;
}

// Map a math domain onto the SVG viewBox, inside [left, right, top, bottom] padding.
function frame(svg, { x: [x0, x1], y: [y0, y1], pad: [pl, pr, pt, pb] }) {
  const { width: W, height: H } = svg.viewBox.baseVal;
  const sx = (W - pl - pr) / (x1 - x0);
  const sy = (H - pt - pb) / (y1 - y0);
  const X = (x) => pl + (x - x0) * sx;
  const Y = (y) => pt + (y1 - y) * sy;
  const path = (fn, a = x0, b = x1, n = 240) => {
    let d = "";
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n;
      d += `${i ? "L" : "M"}${X(x).toFixed(2)} ${Y(fn(x)).toFixed(2)}`;
    }
    return d;
  };
  return { X, Y, W, H, x0, x1, y0, y1, path };
}

const PI_LABELS = { 1: "π/2", 2: "π", 3: "3π/2", 4: "2π", 6: "3π", 8: "4π" };

function axes(svg, f, { grid = false, ticks = [2, 4], yTicks = [1, -1] } = {}) {
  const g = el(svg, "g");
  if (grid) {
    for (let k = Math.ceil((f.x0 * 2) / PI); k <= Math.floor((f.x1 * 2) / PI); k++) {
      el(g, "line", { class: "p-grid", x1: f.X((k * PI) / 2), x2: f.X((k * PI) / 2), y1: f.Y(f.y1), y2: f.Y(f.y0) });
    }
    for (let y = Math.ceil(f.y0); y <= Math.floor(f.y1); y++) {
      el(g, "line", { class: "p-grid", x1: f.X(f.x0), x2: f.X(f.x1), y1: f.Y(y), y2: f.Y(y) });
    }
  }
  el(g, "line", { class: "p-axis", x1: f.X(f.x0), x2: f.X(f.x1), y1: f.Y(0), y2: f.Y(0) });
  if (f.x0 <= 0) el(g, "line", { class: "p-axis", x1: f.X(0), x2: f.X(0), y1: f.Y(f.y0), y2: f.Y(f.y1) });
  for (const k of ticks) {
    const x = f.X((k * PI) / 2);
    el(g, "line", { class: "p-tick", x1: x, x2: x, y1: f.Y(0) - 4, y2: f.Y(0) + 4 });
    el(g, "text", { class: "p-text p-text--muted", x, y: f.Y(0) + 20, "text-anchor": "middle" }, PI_LABELS[k]);
  }
  if (f.x0 <= 0) {
    for (const y of yTicks) {
      el(g, "line", { class: "p-tick", x1: f.X(0) - 4, x2: f.X(0) + 4, y1: f.Y(y), y2: f.Y(y) });
      el(g, "text", { class: "p-text p-text--muted", x: f.X(0) - 9, y: f.Y(y) + 4, "text-anchor": "end" }, y < 0 ? `−${-y}` : `${y}`);
    }
  }
  return g;
}

function curve(svg, d, cls = "") {
  const p = el(svg, "path", { class: `p-curve p-draw ${cls}`.trim(), d });
  p.style.setProperty("--len", Math.ceil(p.getTotalLength()) + 1);
  return p;
}

const text = (svg, x, y, s, cls = "", anchor = "start") =>
  el(svg, "text", { class: `p-text ${cls}`.trim(), x, y, "text-anchor": anchor }, s);

/* ---------- Figures ---------- */

const plots = {
  // Masthead — two periods of sin x drawn edge to edge as the page's horizon.
  // Rendered at the SVG's real pixel size (and again on resize) so strokes and labels never stretch.
  horizon(svg) {
    const render = () => {
      const { width: w, height: h } = svg.getBoundingClientRect();
      if (!w || !h) return;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.replaceChildren();
      const f = frame(svg, { x: [0, 4 * PI], y: [-1.15, 1.15], pad: [0, 0, 10, 26] });
      el(svg, "line", { class: "p-axis", x1: 0, x2: w, y1: f.Y(0), y2: f.Y(0) });
      for (let k = 1; k <= 8; k++) {
        const x = f.X((k * PI) / 2), major = k % 2 === 0;
        el(svg, "line", { class: "p-tick", x1: x, x2: x, y1: f.Y(0) - (major ? 6 : 3), y2: f.Y(0) + (major ? 6 : 3) });
        if (major && k < 8) el(svg, "text", { class: "p-text p-text--muted", x, y: f.Y(0) + 22, "text-anchor": "middle" }, PI_LABELS[k]);
      }
      el(svg, "path", { class: "p-area", d: `${f.path(Math.sin, 0, PI, 120)}L${f.X(PI)} ${f.Y(0)}L${f.X(0)} ${f.Y(0)}Z` });
      curve(svg, f.path(Math.sin, 0, 4 * PI, 480), "p-curve--accent");
      el(svg, "circle", { class: "p-dot", cx: f.X(PI / 2), cy: f.Y(1), r: 4 });
      el(svg, "text", { class: "p-horizon-label", x: f.X(PI / 2) + 10, y: f.Y(1) - 12 }, "y = sin x");
      el(svg, "text", { class: "p-text p-text--muted", x: w - 8, y: f.Y(0) + 22, "text-anchor": "end" }, "4π");
    };
    render();
    let t;
    addEventListener("resize", () => { clearTimeout(t); t = setTimeout(render, 120); });
  },

  // Fig. 2 — sin x, area under [0, π], and a tangent that follows scroll.
  tangent(svg, figure) {
    const f = frame(svg, { x: [-0.35, 2 * PI + 0.35], y: [-1.35, 1.35], pad: [40, 24, 24, 36] });
    axes(svg, f, { grid: true, ticks: [1, 2, 3, 4] });
    el(svg, "path", { class: "p-area", d: `${f.path(Math.sin, 0, PI, 120)}L${f.X(PI)} ${f.Y(0)}L${f.X(0)} ${f.Y(0)}Z` });
    curve(svg, f.path(Math.cos), "p-curve--faint");
    curve(svg, f.path(Math.sin), "p-curve--accent");

    const integral = text(svg, f.X(PI / 2) + 6, f.Y(0.36), "∫", "p-text--accent", "middle");
    el(integral, "tspan", { "font-size": 10, dx: 1, dy: 5 }, "0");
    el(integral, "tspan", { "font-size": 10, dx: -6, dy: -15 }, "π");
    el(integral, "tspan", { dx: 3, dy: 10 }, "sin x dx = 2");
    text(svg, f.X(PI / 2) + 14, f.Y(1) - 12, "f(x) = sin x");
    text(svg, f.X(2 * PI) - 6, f.Y(1) - 12, "f′(x) = cos x", "p-text--muted", "end");

    const clipId = "clip-tangent";
    const clip = el(el(svg, "defs"), "clipPath", { id: clipId });
    el(clip, "rect", { x: f.X(f.x0), y: f.Y(f.y1), width: f.X(f.x1) - f.X(f.x0), height: f.Y(f.y0) - f.Y(f.y1) });
    const guide = el(svg, "line", { class: "p-guide" });
    const tangent = el(svg, "line", { class: "p-tangent", "clip-path": `url(#${clipId})` });
    const dot = el(svg, "circle", { class: "p-dot", r: 4.5 });
    const outX = figure.querySelector('[data-out="x"]');
    const outM = figure.querySelector('[data-out="m"]');

    const set = (t) => {
      const y = Math.sin(t), m = Math.cos(t), h = 1.1;
      tangent.setAttribute("x1", f.X(t - h)); tangent.setAttribute("y1", f.Y(y - m * h));
      tangent.setAttribute("x2", f.X(t + h)); tangent.setAttribute("y2", f.Y(y + m * h));
      guide.setAttribute("x1", f.X(t)); guide.setAttribute("x2", f.X(t));
      guide.setAttribute("y1", f.Y(0)); guide.setAttribute("y2", f.Y(y));
      dot.setAttribute("cx", f.X(t)); dot.setAttribute("cy", f.Y(y));
      outX.textContent = t.toFixed(2);
      outM.textContent = (m < 0 ? "−" : "") + Math.abs(m).toFixed(2);
    };

    if (reduceMotion) return set(PI / 3);
    const section = figure.closest("section");
    let queued = false;
    const update = () => {
      queued = false;
      const r = section.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
      set(0.25 + p * (2 * PI - 0.5));
    };
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  },

  // Fig. 3a — sin x
  sine(svg) {
    const f = frame(svg, { x: [0, 2 * PI], y: [-1.25, 1.25], pad: [10, 10, 14, 30] });
    axes(svg, f, { ticks: [2, 4], yTicks: [] });
    curve(svg, f.path(Math.sin), "p-curve--accent");
  },

  // Fig. 3b — cos x, the derivative of sin x (shown faint)
  cosine(svg) {
    const f = frame(svg, { x: [0, 2 * PI], y: [-1.25, 1.25], pad: [10, 10, 14, 30] });
    axes(svg, f, { ticks: [2, 4], yTicks: [] });
    curve(svg, f.path(Math.sin), "p-curve--faint");
    curve(svg, f.path(Math.cos), "p-curve--accent");
  },

  // Fig. 3c — e^(−x/3) sin 2x inside its envelope ±e^(−x/3)
  damped(svg) {
    const f = frame(svg, { x: [0, 2 * PI], y: [-1.1, 1.1], pad: [10, 10, 14, 30] });
    axes(svg, f, { ticks: [2, 4], yTicks: [] });
    const env = (x) => Math.exp(-x / 3);
    el(svg, "path", { class: "p-curve p-guide", d: f.path(env) });
    el(svg, "path", { class: "p-curve p-guide", d: f.path((x) => -env(x)) });
    curve(svg, f.path((x) => env(x) * Math.sin(2 * x)), "p-curve--accent");
  },

  // Fig. 3d — two vectors, the angle between them, and b projected onto a
  vectors(svg) {
    const o = { x: 34, y: 150 };
    const a = { ang: (14 * PI) / 180, len: 250 };
    const b = { ang: (49 * PI) / 180, len: 170 };
    const tip = (v, len = v.len) => ({ x: o.x + len * Math.cos(v.ang), y: o.y - len * Math.sin(v.ang) });
    const ta = tip(a), tb = tip(b);
    const theta = b.ang - a.ang;
    const proj = tip(a, b.len * Math.cos(theta));

    el(svg, "line", { class: "p-axis", x1: o.x, y1: o.y, x2: 310, y2: o.y });
    el(svg, "line", { class: "p-axis", x1: o.x, y1: o.y, x2: o.x, y2: 8 });
    el(svg, "line", { class: "p-guide", x1: tb.x, y1: tb.y, x2: proj.x, y2: proj.y });

    for (const [v, t, accent] of [[a, ta, true], [b, tb, false]]) {
      curve(svg, `M${o.x} ${o.y}L${t.x.toFixed(2)} ${t.y.toFixed(2)}`, accent ? "p-curve--accent" : "");
      const back = (s) => ({ x: t.x - 9 * Math.cos(v.ang + s), y: t.y + 9 * Math.sin(v.ang + s) });
      const l = back(0.45), r = back(-0.45);
      el(svg, "path", { class: `p-curve ${accent ? "p-curve--accent" : ""}`, d: `M${l.x} ${l.y}L${t.x} ${t.y}L${r.x} ${r.y}` });
    }

    const R = 46;
    const p1 = tip(a, R), p2 = tip(b, R);
    curve(svg, `M${p1.x} ${p1.y}A${R} ${R} 0 0 0 ${p2.x} ${p2.y}`, "p-curve--faint");
    const mid = { ang: (a.ang + b.ang) / 2 };
    const pt = tip(mid, R + 14);
    text(svg, pt.x, pt.y + 5, "θ", "", "middle");
    text(svg, ta.x - 4, ta.y - 12, "a", "p-text--accent", "end");
    text(svg, tb.x + 8, tb.y + 4, "b");
    text(svg, 310, 24, `cos θ ≈ ${Math.cos(theta).toFixed(2)}`, "p-text--muted", "end");
  },

  // Fig. 4 — Fourier partial sums of a square wave: S₁, S₃, S₅, S₇
  fourier(svg) {
    const f = frame(svg, { x: [-0.2, 4 * PI + 0.2], y: [-1.6, 1.6], pad: [16, 16, 32, 36] });
    axes(svg, f, { ticks: [2, 4, 6, 8], yTicks: [] });
    const square = [];
    for (let k = 0; k < 4; k++) {
      const s = k % 2 ? -1 : 1, a = k * PI, b = (k + 1) * PI;
      square.push(`${k ? "L" : "M"}${f.X(a)} ${f.Y(s)}L${f.X(b)} ${f.Y(s)}`);
    }
    el(svg, "path", { class: "p-curve p-guide", d: square.join("") });
    const S = (n) => (x) => {
      let sum = 0;
      for (let k = 1; k <= n; k += 2) sum += Math.sin(k * x) / k;
      return (4 / PI) * sum;
    };
    [[1, 0.16], [3, 0.26], [5, 0.4]].forEach(([n, op]) => {
      curve(svg, f.path(S(n), f.x0, f.x1, 400)).style.strokeOpacity = op;
    });
    curve(svg, f.path(S(7), f.x0, f.x1, 600), "p-curve--accent");
    text(svg, f.X(f.x1), 16, "S₇(x) = (4/π) Σ sin((2k−1)x) ⁄ (2k−1),  k = 1…4", "p-text--muted", "end");
  },
};

document.querySelectorAll("figure[data-plot]").forEach((figure) => {
  const svg = figure.querySelector("svg");
  plots[figure.dataset.plot]?.(svg, figure);
});

// Draw curves once, when each figure scrolls into view.
const drawObserver = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-drawn");
    drawObserver.unobserve(e.target);
  }),
  { threshold: 0.35 }
);
document.querySelectorAll("figure[data-plot]").forEach((f) => drawObserver.observe(f));
