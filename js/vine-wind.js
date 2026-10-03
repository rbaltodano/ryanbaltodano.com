// Vines blowing in the wind (the sprite sheets in assets/home/): each plays only while it is on
// screen, so a page parked elsewhere is not animating in the background. They also drift behind
// the page as it scrolls (parallax): each vine lags the scroll by its own share of the distance,
// so the two read as sitting at different depths. Phones get no parallax.
(function () {
  var vines = document.querySelectorAll('.hero__vine--wind');
  if (!vines.length) return;

  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.querySelector('img').style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
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
