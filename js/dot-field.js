// Dot-grid background for [data-dot-field] sections: the app's AnimatedDotGridBackground (the same
// drifting brightness the Insight Tree uses), plus a soft glow that follows the pointer.
// data-dot-color sets the dot color as "r, g, b".
(function () {
  var fields = document.querySelectorAll('[data-dot-field]');
  if (!fields.length) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPACING = 16;

  // AnimatedDotGridBackground.blobOpacity, as in js/insight-tree.js.
  function blobOpacity(wx, wy, time) {
    var x = wx * 0.022, y = wy * 0.022;
    var w1 = Math.sin(x * 1.1 + time * 0.22) * Math.cos(y * 0.95 + time * 0.17);
    var w2 = Math.sin(x * 0.65 - y * 0.75 + time * 0.31) * 0.55;
    var w3 = Math.cos(x * 1.4 + y * 1.05 - time * 0.19) * 0.38;
    var n = ((w1 + w2 + w3) / 1.93 + 1) / 2;
    return 0.01 + Math.pow(n, 4) * 0.28;
  }

  Array.prototype.forEach.call(fields, function (root) {
    var color = root.getAttribute('data-dot-color') || '255, 250, 240';
    var canvas = document.createElement('canvas');
    canvas.className = 'dot-field';
    canvas.setAttribute('aria-hidden', 'true');
    root.insertBefore(canvas, root.firstChild);
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, DPR = 1, running = false, visible = false;
    // The glow eases toward the pointer and fades in and out with it.
    var hover = { x: 0, y: 0, tx: 0, ty: 0, on: false, amount: 0 };

    function resize() {
      var r = root.getBoundingClientRect();
      W = r.width; H = r.height;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      if (!running) draw(performance.now());
    }

    function draw(now) {
      var time = reduceMotion ? 0 : now / 1000;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var cols = Math.ceil(W / SPACING), rows = Math.ceil(H / SPACING);
      var ox = (W - (cols - 1) * SPACING) / 2, oy = (H - (rows - 1) * SPACING) / 2;
      var glow = hover.amount > 0.01;
      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          var x = ox + i * SPACING, y = oy + j * SPACING;
          var o = blobOpacity(x, y, time) * 1.6;
          if (glow) {
            var dx = x - hover.x, dy = y - hover.y, d2 = dx * dx + dy * dy;
            if (d2 < 64000) o += 0.45 * hover.amount * Math.exp(-d2 / 11000);
          }
          if (o < 0.012) continue;
          ctx.fillStyle = 'rgba(' + color + ',' + Math.min(o, 0.7).toFixed(3) + ')';
          ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
        }
      }
    }

    var last = performance.now();
    function tick(now) {
      if (!visible) { running = false; return; }
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      var k = 1 - Math.exp(-dt * 14);
      hover.x += (hover.tx - hover.x) * k;
      hover.y += (hover.ty - hover.y) * k;
      hover.amount += ((hover.on ? 1 : 0) - hover.amount) * (1 - Math.exp(-dt * 6));
      draw(now);
      requestAnimationFrame(tick);
    }
    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    }

    root.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = root.getBoundingClientRect();
      hover.tx = e.clientX - r.left; hover.ty = e.clientY - r.top;
      if (!hover.on) { hover.x = hover.tx; hover.y = hover.ty; }
      hover.on = true;
      if (visible) start();
    });
    root.addEventListener('pointerleave', function () { hover.on = false; });

    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(root);
    else window.addEventListener('resize', resize);
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }, { rootMargin: '100px' }).observe(root);
  });
})();
