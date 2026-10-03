// Vines loop the last four grow frames (the sprite sheets in assets/home/), only while on
// screen, so a page parked elsewhere is not animating in the background. They also drift behind
// the page as it scrolls (parallax): each vine lags the scroll by its own share of the distance,
// so the two read as sitting at different depths. Phones get no parallax.
(function () {
  var vines = document.querySelectorAll('.hero__vine--wind');
  if (!vines.length) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  Array.prototype.forEach.call(vines, function (vine) {
    var src = vine.getAttribute('data-paint-src');
    if (!src || reducedMotion.matches) return;
    var idle = vine.querySelector('img');
    var paint = new Image();
    var finished = false;
    // A stalled decorative image must never leave the idle artwork hidden indefinitely.
    var loadTimeout = setTimeout(finish, 8000);
    paint.alt = '';
    paint.className = 'hero__vine-paint';
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(loadTimeout);
      paint.remove();
      vine.classList.add('is-painted');
      idle.style.visibility = '';
      idle.style.animationPlayState = vine.dataset.onScreen === 'false' ? 'paused' : 'running';
      reducedMotion.removeEventListener('change', motionChanged);
    }
    function motionChanged(event) { if (event.matches) finish(); }
    paint.addEventListener('animationend', function (event) {
      if (event.animationName === 'vine-paint') finish();
    });
    paint.addEventListener('error', finish);
    paint.addEventListener('load', function () {
      // Decode before starting the clock so a slow image cannot skip the opening frames.
      var decoded = paint.decode ? paint.decode() : Promise.resolve();
      decoded.then(function () {
        if (finished || reducedMotion.matches) return;
        clearTimeout(loadTimeout);
        // Park the idle on the first of the final four grow frames.
        idle.style.animation = 'none';
        idle.offsetWidth;
        idle.style.animation = '';
        idle.style.animationPlayState = 'paused';
        paint.style.animationPlayState = vine.dataset.onScreen === 'false' ? 'paused' : 'running';
        vine.appendChild(paint);
      }, finish);
    });
    reducedMotion.addEventListener('change', motionChanged);
    paint.src = src;
  });

  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var vine = entry.target;
        vine.dataset.onScreen = String(entry.isIntersecting);
        Array.prototype.forEach.call(vine.querySelectorAll('img'), function (image) {
          var idleBehindPaint = !image.classList.contains('hero__vine-paint') && vine.querySelector('.hero__vine-paint');
          image.style.animationPlayState = entry.isIntersecting && !idleBehindPaint ? 'running' : 'paused';
        });
      });
    });
    Array.prototype.forEach.call(vines, function (vine) { seen.observe(vine); });
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Share of the scroll distance each vine falls behind the page: the left one sits further back.
  var DEPTH = { left: 0.22, right: 0.12 };
  var hero = document.querySelector('.hero');
  var phone = window.matchMedia('(max-width: 560px)');   // no parallax on phones (matches site.css)
  var pending = false;
  function drift() {
    pending = false;
    if (phone.matches) return;
    // Stop drifting once the hero is well out of view, so the vines never wander off their place.
    var limit = hero ? hero.offsetHeight : window.innerHeight * 2;
    var scrolled = Math.min(Math.max(window.scrollY, 0), limit);
    Array.prototype.forEach.call(vines, function (vine) {
      var depth = vine.classList.contains('hero__vine--left') ? DEPTH.left : DEPTH.right;
      vine.style.setProperty('--parallax', (scrolled * depth).toFixed(1) + 'px');
    });
  }
  function queue() { if (!pending) { pending = true; requestAnimationFrame(drift); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  drift();
})();
