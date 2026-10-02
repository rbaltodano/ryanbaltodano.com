// Library card on the home page. The app's Library cards scroll in a seamless loop over a
// painting, and the loop follows the page: scrolling down carries the cards up, scrolling up
// reverses them, and a quick scroll briefly speeds them along. Hovering holds them still.
// Works, subjects, and passage counts come from the app's bundled corpus. Without JS or with
// reduced motion the cards simply rest.
(function () {
  var root = document.querySelector('[data-grounding-demo]');
  if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var track = root.querySelector('[data-g-track]');
  var originals = Array.prototype.slice.call(track.children);
  // A second copy follows the first, so wrapping around one set's height has no seam.
  originals.forEach(function (work) {
    var copy = work.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.appendChild(copy);
  });

  var SPEED = 30;          // px per second at rest
  var BOOST = 0.35;        // share of the page's scroll distance added to the cards
  var offset = 0, direction = 1, extra = 0, held = false, visible = false;
  var lastScroll = window.scrollY, last = 0, frame = 0;

  function period() {
    // The distance from a card to its copy: one full set, including the gap after it.
    return track.children[originals.length].offsetTop - track.children[0].offsetTop;
  }

  window.addEventListener('scroll', function () {
    var dy = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    if (!dy) return;
    direction = dy > 0 ? 1 : -1;
    if (visible) extra += Math.abs(dy) * BOOST;
  }, { passive: true });
  root.addEventListener('pointerenter', function () { held = true; });
  root.addEventListener('pointerleave', function () { held = false; });

  function tick(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    // The scroll boost drains away over about half a second.
    var spend = extra * Math.min(1, dt * 6);
    extra -= spend;
    if (!held) offset += direction * (SPEED * dt + spend);
    var p = period();
    offset = ((offset % p) + p) % p;
    track.style.transform = 'translateY(' + (-offset).toFixed(2) + 'px)';
    frame = visible ? requestAnimationFrame(tick) : 0;
  }

  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible && !frame) { last = 0; frame = requestAnimationFrame(tick); }
  }, { rootMargin: '100px' }).observe(root);
})();
