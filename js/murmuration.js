/* Murmuration of question marks in the closing CTA. They stream around the edge of the box;
   when the cursor enters they gather and follow it. */
(function () {
  var box = document.querySelector('.cta');
  if (!box) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.createElement('canvas');
  canvas.className = 'cta__birds';
  canvas.setAttribute('aria-hidden', 'true');
  box.insertBefore(canvas, box.firstChild);
  var ctx = canvas.getContext('2d');

  var W = 0, H = 0, dpr = 1, birds = [], leaders = [], pointer = null, raf = 0, visible = true;
  var COLORS = ['134,128,62', '162,143,30', '97,76,64'];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    var r = box.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // A point on a rounded rectangle hugging the inside edge of the box, u in [0, 1).
  function onPath(u) {
    var m = Math.min(56, W * 0.1, H * 0.2), w = W - 2 * m, h = H - 2 * m;
    var rad = Math.min(w, h) / 2, sw = w - 2 * rad, sh = h - 2 * rad;
    var arc = Math.PI * rad / 2, total = 2 * sw + 2 * sh + 4 * arc;
    var d = (u % 1) * total, cx, cy, a;
    if (d < sw) return [m + rad + d, m];
    d -= sw;
    if (d < arc) { a = d / rad - Math.PI / 2; return [m + w - rad + Math.cos(a) * rad, m + rad + Math.sin(a) * rad]; }
    d -= arc;
    if (d < sh) return [m + w, m + rad + d];
    d -= sh;
    if (d < arc) { a = d / rad; return [m + w - rad + Math.cos(a) * rad, m + h - rad + Math.sin(a) * rad]; }
    d -= arc;
    if (d < sw) return [m + w - rad - d, m + h];
    d -= sw;
    if (d < arc) { a = d / rad + Math.PI / 2; return [m + rad + Math.cos(a) * rad, m + h - rad + Math.sin(a) * rad]; }
    d -= arc;
    return [m, m + h - rad - d];
  }

  function init() {
    var n = W < 600 ? 34 : 72;
    leaders = [{ u: 0, v: 0.00026 }, { u: 0.33, v: 0.00026 }, { u: 0.66, v: 0.00026 }];
    birds = [];
    for (var i = 0; i < n; i++) {
      var f = i % 3, p = onPath(leaders[f].u);
      birds.push({
        x: p[0] + rand(-60, 60), y: p[1] + rand(-60, 60),
        vx: rand(-1, 1), vy: rand(-1, 1),
        f: f, size: rand(18, 34), ph: rand(0, 6.28),
        col: COLORS[Math.floor(Math.random() * COLORS.length)], a: rand(0.28, 0.6)
      });
    }
  }

  var MAX = 2.6, VIEW = 90;

  function step(t, dt) {
    var i, j, b, o, dx, dy, d2, k;
    for (i = 0; i < leaders.length; i++) leaders[i].u += leaders[i].v * dt;
    for (i = 0; i < birds.length; i++) {
      b = birds[i];
      var ax = 0, ay = 0, cx = 0, cy = 0, vx = 0, vy = 0, sx = 0, sy = 0, c = 0;
      for (j = 0; j < birds.length; j++) {
        if (i === j) continue;
        o = birds[j]; dx = o.x - b.x; dy = o.y - b.y; d2 = dx * dx + dy * dy;
        if (d2 > VIEW * VIEW) continue;
        c++; cx += o.x; cy += o.y; vx += o.vx; vy += o.vy;
        if (d2 < 26 * 26 && d2 > 0.01) { sx -= dx / d2; sy -= dy / d2; }
      }
      if (c) {
        ax += (cx / c - b.x) * 0.0006 + (vx / c - b.vx) * 0.05;
        ay += (cy / c - b.y) * 0.0006 + (vy / c - b.vy) * 0.05;
      }
      ax += sx * 28; ay += sy * 28;

      var tx, ty, pull;
      if (pointer) {
        // Orbit loosely around the cursor so the flock swirls rather than collapses.
        var a = t * 0.0006 + b.ph;
        var r = 34 + (b.ph * 9) % 46;
        tx = pointer.x + Math.cos(a) * r; ty = pointer.y + Math.sin(a) * r * 0.8; pull = 0.0042;
      } else {
        var p = onPath(leaders[b.f].u);
        tx = p[0] + Math.sin(t * 0.0007 + b.ph) * 95; ty = p[1] + Math.cos(t * 0.0009 + b.ph * 1.7) * 95; pull = 0.0016;
      }
      ax += (tx - b.x) * pull; ay += (ty - b.y) * pull;

      // Keep them inside the box.
      if (b.x < 10) ax += 0.08; else if (b.x > W - 10) ax -= 0.08;
      if (b.y < 10) ay += 0.08; else if (b.y > H - 10) ay -= 0.08;

      b.vx += ax * dt * 0.06; b.vy += ay * dt * 0.06;
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy), lim = pointer ? MAX * 1.35 : MAX;
      if (sp > lim) { b.vx *= lim / sp; b.vy *= lim / sp; }
      else if (sp < 0.7 && sp > 0) { b.vx *= 0.7 / sp; b.vy *= 0.7 / sp; }
      b.x += b.vx * dt * 0.06; b.y += b.vy * dt * 0.06;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i];
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx) * 0.35);
      ctx.font = '400 ' + b.size + 'px "Libre Baskerville", Georgia, serif';
      ctx.fillStyle = 'rgba(' + b.col + ',' + b.a + ')';
      ctx.fillText('?', 0, 0);
      ctx.restore();
    }
  }

  var last = 0;
  function frame(t) {
    var dt = Math.min(t - last, 50) || 16; last = t;
    step(t, dt); draw();
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  function start() { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  function setPointer(e) {
    var r = box.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  box.addEventListener('pointerenter', setPointer);
  box.addEventListener('pointermove', setPointer);
  box.addEventListener('pointerleave', function () { pointer = null; });

  resize(); init();
  if (reduce) { for (var s = 0; s < 400; s++) step(s * 16, 16); draw(); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }).observe(box);
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { resize(); if (reduce) draw(); }).observe(box);
  }
  start();
})();
