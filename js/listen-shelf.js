// Listening shelf on the home page, after the app's Library listening cards. One work is read
// at a time: pressing Listen moves that card to the front of the shelf at 1.1x, swaps its play
// icon for a ring, and the ring fills as the reading goes on. Pressing it again pauses.
// The shelf rearranges on the app's menu curve. Without JS the cards simply rest.
(function () {
  var shelf = document.querySelector('[data-listen-shelf]');
  if (!shelf) return;

  var EASE = 'cubic-bezier(0.55, 0, 0.17, 1)';
  var MOVE_MS = 700;
  var WORK_SECONDS = 60;   // how long the demo takes to "read" a whole work
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cards = Array.prototype.slice.call(shelf.children);
  var progress = new Map(cards.map(function (c) { return [c, parseFloat(c.style.getPropertyValue('--p')) || 0]; }));
  var playing = shelf.querySelector('.listen-card.is-playing');
  var visible = false, last = 0, frame = 0;

  function center(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function setState(card, on) {
    card.classList.toggle('is-playing', on);
    var button = card.querySelector('.listen-card__pill');
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    card.querySelector('[data-listen-label]').textContent = on ? 'Listening' : 'Listen';
  }

  // FLIP: note where every card is, change the order and states, then animate each card from
  // its old place and scale to its new one. Centers ignore scale, which grows from the middle.
  function rearrange(change) {
    var before = new Map(cards.map(function (c) {
      // The current scale, which may be mid-hover.
      var t = getComputedStyle(c).transform;
      return [c, { at: center(c), scale: t === 'none' ? 1 : new DOMMatrix(t).a }];
    }));
    change();
    if (reduce.matches) return;
    cards.forEach(function (c) {
      var was = before.get(c), now = center(c);
      var scale = c.classList.contains('is-playing') ? 1.1 : 1;
      var dx = was.at.x - now.x, dy = was.at.y - now.y;
      if (!dx && !dy && was.scale === scale) return;
      c.animate([
        { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + was.scale + ')' },
        { transform: 'scale(' + scale + ')' }
      ], { duration: MOVE_MS, easing: EASE });
    });
  }

  shelf.addEventListener('click', function (event) {
    var button = event.target.closest('.listen-card__pill');
    if (!button) return;
    var card = button.closest('.listen-card');
    var starting = card !== playing;
    rearrange(function () {
      if (playing) setState(playing, false);
      playing = starting ? card : null;
      if (!playing) return;
      if (progress.get(card) >= 1) progress.set(card, 0);
      setState(card, true);
      shelf.prepend(card);
    });
    // On phones the shelf scrolls; bring the front card into view. Snapping is off while the
    // cards move, since it would otherwise follow their in-flight positions.
    if (starting && shelf.scrollLeft) {
      shelf.style.scrollSnapType = 'none';
      shelf.scrollTo({ left: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
      // Snap again once the scroll settles (a timer covers browsers without scrollend).
      var resnap = function () {
        if (shelf.scrollLeft > 1 && Date.now() < deadline) return;
        shelf.removeEventListener('scrollend', resnap);
        shelf.style.scrollSnapType = '';
      };
      var deadline = Date.now() + 1500;
      shelf.addEventListener('scrollend', resnap);
      setTimeout(function () { deadline = 0; resnap(); }, 1500);
    }
    start();
  });

  function tick(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    frame = 0;
    if (!playing || !visible) return;
    var p = Math.min(1, progress.get(playing) + dt / WORK_SECONDS);
    progress.set(playing, p);
    playing.style.setProperty('--p', p.toFixed(4));
    if (p >= 1) {
      // Finished: the work rests at full, and the shelf is quiet until the next Listen.
      var done = playing;
      rearrange(function () { setState(done, false); playing = null; });
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (frame || !playing || !visible) return;
    last = 0;
    frame = requestAnimationFrame(tick);
  }

  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    start();
  }).observe(shelf);
})();
