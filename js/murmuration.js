/* Murmuration of question marks in the closing CTA. Flocks stream around the edge of the box;
   when the cursor enters they gather and circle it. Each mark turns so its dot leads, the way
   a bird's head does.

   Smoothness comes from steering rather than pushing: every rule produces a desired velocity,
   the bird turns toward it with a capped force, and its drawn heading eases toward its actual
   heading. Nothing snaps, so nothing jitters. */
(function () {
  var box = document.querySelector('.cta');
  if (!box) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.createElement('canvas');
  canvas.className = 'cta__birds';
  canvas.setAttribute('aria-hidden', 'true');
  box.insertBefore(canvas, box.firstChild);
  var ctx = canvas.getContext('2d');

  var COLORS = ['#86803E', '#A28F1E', '#614C40'];
  var LIGHT = '#FFFAF0';                  // canvas primary, used over the photo
  var FLOCKS = 3;
  var SPEED = 1.6, FOLLOW_SPEED = 4.3;   // px per 60fps frame
  var LOOP_SPEED = 1.3;                   // how fast the flocks travel round the box
  var FORCE = 0.08;                       // max change in velocity per frame: how sharply they turn
  var VIEW = 70, SPACE = 22;              // neighbour radius, personal space
  var TURN = 0.14;                        // how quickly the drawn heading catches up

  var W = 0, H = 0, dpr = 1, birds = [], sprites = [], raf = 0, visible = true, clock = 0;
  var pointer = null, aim = { x: 0, y: 0 }, follow = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }

  // Each colour/size is drawn once to its own canvas, centred on the glyph's visual middle,
  // so a frame is just rotated image blits.
  var SIZES = [18, 23, 28, 33];
  function glyph(color, size) {
    var px = size * dpr, pad = Math.ceil(px * 0.3);
    var cv = document.createElement('canvas'), g = cv.getContext('2d');
    g.font = '400 ' + px + 'px "Libre Baskerville", Georgia, serif';
    var m = g.measureText('?');
    var w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    var h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    cv.width = Math.ceil(w + pad * 2); cv.height = Math.ceil(h + pad * 2);
    g.font = '400 ' + px + 'px "Libre Baskerville", Georgia, serif';
    g.fillStyle = color;
    g.fillText('?', pad + m.actualBoundingBoxLeft, pad + m.actualBoundingBoxAscent);
    return cv;
  }
  // sprites[colour * sizes + size]; lightSprites[size] is the canvas-primary version for over the photo.
  var lightSprites = [];
  function makeSprites() {
    sprites = []; lightSprites = [];
    for (var c = 0; c < COLORS.length; c++) for (var s = 0; s < SIZES.length; s++) sprites.push(glyph(COLORS[c], SIZES[s]));
    for (var t = 0; t < SIZES.length; t++) lightSprites.push(glyph(LIGHT, SIZES[t]));
  }

  // The photo's skyline, from its alpha: for each column, how far down the first solid pixel is
  // (as a fraction of the image height). Marks below it are over the countryside.
  var scene = box.querySelector('.cta__scene'), skyline = null, sceneRect = null;
  function readSkyline() {
    if (!scene || !scene.naturalWidth) return;
    var cols = 400, rows = 80, cv = document.createElement('canvas'), g = cv.getContext('2d');
    cv.width = cols; cv.height = rows;
    g.drawImage(scene, 0, 0, cols, rows);
    try {
      var d = g.getImageData(0, 0, cols, rows).data;
      skyline = new Float32Array(cols);
      for (var x = 0; x < cols; x++) {
        var y = 0;
        while (y < rows && d[(y * cols + x) * 4 + 3] < 128) y++;
        skyline[x] = y / rows;
      }
    } catch (e) { skyline = null; }
    measureScene();
  }
  function measureScene() {
    if (!scene) return;
    var b = box.getBoundingClientRect(), r = scene.getBoundingClientRect();
    sceneRect = { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
  }
  // Is a point (in box coordinates) over the countryside?
  function overScene(x, y) {
    if (!sceneRect || y < sceneRect.y) return false;
    if (!skyline) return true;
    var u = (x - sceneRect.x) / sceneRect.w;
    if (u < 0 || u >= 1) return false;
    return y >= sceneRect.y + skyline[Math.floor(u * skyline.length)] * sceneRect.h;
  }
  if (scene) {
    if (scene.complete && scene.naturalWidth) readSkyline();
    else scene.addEventListener('load', readSkyline);
  }

  function resize() {
    var r = box.getBoundingClientRect();
    var nd = Math.min(window.devicePixelRatio || 1, 2);
    var scaleX = W ? r.width / W : 1, scaleY = H ? r.height / H : 1;
    W = r.width; H = r.height;
    canvas.width = Math.round(W * nd);
    canvas.height = Math.round(H * nd);
    if (nd !== dpr || !sprites.length) { dpr = nd; makeSprites(); }
    for (var i = 0; i < birds.length; i++) { birds[i].x *= scaleX; birds[i].y *= scaleY; }
    buildPath();
    measureScene();
  }

  // A smooth loop just inside the box: a superellipse, so it hugs the corners without the
  // speed changes a rounded rectangle's straight-to-arc joins cause. It's resampled by arc
  // length so a point moving along it at a steady rate moves at a steady speed.
  var path = [], pathLen = 1;
  function buildPath() {
    var m = Math.min(64, W * 0.1, H * 0.18), rx = W / 2 - m, ry = H / 2 - m, N = 720, pts = [], len = [0];
    for (var i = 0; i <= N; i++) {
      var a = i / N * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pts.push([W / 2 + rx * Math.sign(c) * Math.pow(Math.abs(c), 0.45),
                H / 2 + ry * Math.sign(s) * Math.pow(Math.abs(s), 0.45)]);
      if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    pathLen = len[N] || 1;
    path = [];
    for (var j = 0, seg = 0; j < 360; j++) {
      var want = j / 360 * pathLen;
      while (len[seg + 1] < want) seg++;
      var t = (want - len[seg]) / ((len[seg + 1] - len[seg]) || 1);
      path.push([pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * t, pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * t]);
    }
  }
  function loop(u) {
    u = ((u % 1) + 1) % 1 * path.length;
    var i = Math.floor(u), t = u - i, a = path[i], b = path[(i + 1) % path.length];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }

  function init() {
    var n = W < 600 ? 60 : 130;
    birds = [];
    for (var i = 0; i < n; i++) {
      var f = i % FLOCKS, p = loop(f / FLOCKS);
      var a = rand(0, Math.PI * 2), sp = rand(0.5, 1.5);
      birds.push({
        x: p[0] + rand(-50, 50), y: p[1] + rand(-50, 50),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        rot: a - Math.PI / 2,
        f: f,
        seed: rand(0, 1000),
        ring: rand(24, 96),            // the distance it likes to circle the cursor at
        bend: (Math.random() < 0.5 ? -1 : 1) * rand(0.15, 0.6),   // radians off a straight approach
        sprite: Math.floor(Math.random() * sprites.length),
        alpha: rand(0.35, 0.7),
        light: 0                        // 0 = brand colour, 1 = canvas primary
      });
    }
  }

  function steer(b, dx, dy, speed, weight, acc) {
    var d = Math.hypot(dx, dy);
    if (d < 1e-4) return;
    acc.x += (dx / d * speed - b.vx) * weight;
    acc.y += (dy / d * speed - b.vy) * weight;
  }

  function step(k) {
    clock += k;
    follow += ((pointer ? 1 : 0) - follow) * (1 - Math.exp(-k * 0.08));
    if (pointer) {
      var e = 1 - Math.exp(-k * 0.3);
      aim.x += (pointer.x - aim.x) * e; aim.y += (pointer.y - aim.y) * e;
    }
    var speed = SPEED + (FOLLOW_SPEED - SPEED) * follow;
    var acc = { x: 0, y: 0 };

    for (var i = 0; i < birds.length; i++) {
      var b = birds[i];
      acc.x = 0; acc.y = 0;

      // Flocking: keep space, match neighbours' heading, drift toward their middle.
      var n = 0, ax = 0, ay = 0, sx = 0, sy = 0;
      for (var j = 0; j < birds.length; j++) {
        if (j === i) continue;
        var o = birds[j], dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 > VIEW * VIEW) continue;
        var d = Math.sqrt(d2) || 0.01;
        n++; ax += o.vx; ay += o.vy;
        if (d < SPACE) { var push = 1 - d / SPACE; sx -= dx / d * push; sy -= dy / d * push; }
      }
      if (n) steer(b, ax, ay, speed, 0.3, acc);
      acc.x += sx * 0.12; acc.y += sy * 0.12;

      // Where it is headed, as a velocity. At rest: drift along the loop with the flock, eased
      // toward a slowly wandering spot near the flock's centre so they spread and regroup.
      var dvx = 0, dvy = 0;
      if (follow < 0.999) {
        var u = clock * LOOP_SPEED / pathLen + b.f / FLOCKS;
        var p = loop(u), p0 = loop(u - 0.002), p1 = loop(u + 0.002);
        var tl = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
        // Each bird keeps a loose slot in a stream that is long along the loop and thin across it.
        var tx = (p1[0] - p0[0]) / tl, ty = (p1[1] - p0[1]) / tl;
        var along = Math.sin(clock * 0.0021 + b.seed) * 120, across = Math.cos(clock * 0.0033 + b.seed * 1.3) * 42;
        var ox = p[0] + tx * along - ty * across - b.x;
        var oy = p[1] + ty * along + tx * across - b.y;
        var rvx = tx * LOOP_SPEED + ox * 0.02;
        var rvy = ty * LOOP_SPEED + oy * 0.02;
        var rl = Math.hypot(rvx, rvy), rcap = SPEED * 1.6;
        if (rl > rcap) { rvx *= rcap / rl; rvy *= rcap / rl; }
        dvx += rvx * (1 - follow); dvy += rvy * (1 - follow);
      }
      if (follow > 0.001) {
        // Circle the cursor (tangent) while easing in or out to this bird's ring.
        var rx = b.x - aim.x, ry = b.y - aim.y, rd = Math.hypot(rx, ry) || 0.01;
        var ux = rx / rd, uy = ry / rd;
        var pull = Math.max(-2.5, Math.min(2.5, (rd - b.ring) / 40));
        var cx2 = -uy - ux * pull, cy2 = ux - uy * pull, cl = Math.hypot(cx2, cy2) || 1;
        cx2 /= cl; cy2 /= cl;
        // On the way in, each bird bends its line a little to one side (and the bend drifts),
        // so they arrive along a fan of curved paths rather than one straight beam. The bend
        // fades out as it reaches its ring.
        var approach = Math.max(0, Math.min(1, (rd - b.ring) / 160));
        var bend = (b.bend + Math.sin(clock * 0.012 + b.seed) * 0.18) * approach;
        var bc = Math.cos(bend), bs = Math.sin(bend);
        dvx += (cx2 * bc - cy2 * bs) * FOLLOW_SPEED * follow;
        dvy += (cx2 * bs + cy2 * bc) * FOLLOW_SPEED * follow;
      }
      acc.x += (dvx - b.vx) * 0.6; acc.y += (dvy - b.vy) * 0.6;

      // Soft walls.
      var edge = 24;
      if (b.x < edge) acc.x += (edge - b.x) * 0.004;
      else if (b.x > W - edge) acc.x -= (b.x - (W - edge)) * 0.004;
      if (b.y < edge) acc.y += (edge - b.y) * 0.004;
      else if (b.y > H - edge) acc.y -= (b.y - (H - edge)) * 0.004;

      // Turn with a capped force, so changes of direction are always gradual.
      var al = Math.hypot(acc.x, acc.y);
      if (al > FORCE) { acc.x *= FORCE / al; acc.y *= FORCE / al; }
      b.vx += acc.x * k; b.vy += acc.y * k;
      var sp = Math.hypot(b.vx, b.vy), cap = speed * 1.25;
      if (sp > cap) { b.vx *= cap / sp; b.vy *= cap / sp; }
      b.x += b.vx * k; b.y += b.vy * k;

      // The glyph's dot points down (+y), so turn it by heading − 90°, along the shorter arc.
      if (sp > 0.05) {
        var want = Math.atan2(b.vy, b.vx) - Math.PI / 2;
        var diff = Math.atan2(Math.sin(want - b.rot), Math.cos(want - b.rot));
        b.rot += diff * (1 - Math.exp(-k * TURN));
      }
      b.light += ((overScene(b.x, b.y) ? 1 : 0) - b.light) * (1 - Math.exp(-k * 0.15));
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i], img = sprites[b.sprite], c = Math.cos(b.rot), s = Math.sin(b.rot);
      ctx.setTransform(c, s, -s, c, b.x * dpr, b.y * dpr);
      // Crossfade to the light glyph over the photo; it's drawn stronger to read on the trees.
      if (b.light < 0.99) {
        ctx.globalAlpha = b.alpha * (1 - b.light);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
      }
      if (b.light > 0.01) {
        var li = lightSprites[b.sprite % SIZES.length];
        ctx.globalAlpha = Math.min(1, b.alpha + 0.3) * b.light;
        ctx.drawImage(li, -li.width / 2, -li.height / 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  var last = 0;
  function frame(t) {
    var k = Math.min((t - last) / 16.667, 3); last = t;
    // Sub-step long frames so a hitch never becomes a lurch.
    var steps = Math.ceil(k);
    for (var i = 0; i < steps; i++) step(k / steps);
    draw();
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  function start() {
    if (raf || reduce) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // The countryside along the bottom is out of range: over it, they go back to the loop.
  function setPointer(e) {
    if (e.pointerType === 'touch') return;   // touch has no hover; see tap-to-call below
    var r = box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    measureScene();
    if (overScene(x, y)) { pointer = null; return; }
    if (!pointer) { aim.x = x; aim.y = y; }
    pointer = { x: x, y: y };
  }
  box.addEventListener('pointerenter', setPointer);
  box.addEventListener('pointermove', setPointer);
  box.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') pointer = null; });

  // Tap-to-call on touch screens: a tap (not a scroll) draws the flock to that spot; they circle
  // it for a moment, then drift back to the loop. A tap on the photo is out of range.
  var CALL_MS = 2000, tapStart = null, release = 0;
  box.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') tapStart = { x: e.clientX, y: e.clientY, t: e.timeStamp };
  });
  box.addEventListener('pointercancel', function () { tapStart = null; });
  box.addEventListener('pointerup', function (e) {
    if (e.pointerType !== 'touch' || !tapStart) return;
    var moved = Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y), held = e.timeStamp - tapStart.t;
    tapStart = null;
    if (moved > 12 || held > 600) return;
    var r = box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    measureScene();
    if (overScene(x, y)) return;
    if (!pointer) { aim.x = x; aim.y = y; }
    pointer = { x: x, y: y };
    clearTimeout(release);
    release = setTimeout(function () { pointer = null; }, CALL_MS);
  });

  function boot() {
    resize(); init();
    if (reduce) { for (var s = 0; s < 400; s++) step(1); draw(); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }).observe(box);
    }
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { resize(); if (reduce) draw(); }).observe(box);
    }
    start();
  }
  // Wait for the serif so the sprites aren't drawn in the fallback face.
  if (document.fonts && document.fonts.load) {
    document.fonts.load('400 24px "Libre Baskerville"').then(boot, boot);
  } else boot();
})();
