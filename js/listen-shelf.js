// Listening shelf on the home page, after the app's Library listening cards. One work is read
// at a time: pressing a card picks up that work where you left off, with a ring in place of its play icon showing how far through the work you are.
// Pressing its Listen pill again pauses.
// Wider screens: the card being read moves to the front of the shelf, and every five seconds
// the next work takes the lead, rearranging on the app's menu curve.
// Phones: the shelf is an endless sideways loop that drifts along and can be swiped either way;
// a pressed card plays where it is.
// Without JS the cards simply rest.
(function () {
  var shelf = document.querySelector('[data-listen-shelf]');
  if (!shelf) return;

  var EASE = 'cubic-bezier(0.55, 0, 0.17, 1)';
  var MOVE_MS = 500;
  var ROTATE_MS = 5000;
  var REST = 1, PLAYING = 1;
  var DRIFT = 60;          // px per second the phone loop moves on its own
  var COPIES = 4;          // extra sets of cards on phones, so a fling never reaches an end
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var phone = window.matchMedia('(max-width: 560px)');
  var cards = Array.prototype.slice.call(shelf.children);
  var playing = shelf.querySelector('.listen-card.is-playing');
  var rotationTimer;

  cards.forEach(function (c, i) { c.dataset.work = i; });

  function scheduleRotation() {
    clearTimeout(rotationTimer);
    rotationTimer = setTimeout(function () {
      if (!document.hidden && !phone.matches && playing) {
        var next = (cards.indexOf(playing) + 1) % cards.length;
        play(cards[next]);
      } else {
        scheduleRotation();
      }
    }, ROTATE_MS);
  }

  function center(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // A work's state shows on every copy of its card.
  function setState(card, on) {
    shelf.querySelectorAll('[data-work="' + card.dataset.work + '"]').forEach(function (c) {
      c.classList.toggle('is-playing', on);
      c.querySelector('.listen-card__pill').setAttribute('aria-pressed', on ? 'true' : 'false');
      c.querySelector('[data-listen-label]').textContent = on ? 'Listening' : 'Listen';
    });
  }

  // FLIP: note where every card is, change the order and states, then animate each card from
  // its old place and scale to its new one. Centers ignore scale, which grows from the middle.
  function rearrange(change) {
    var all = Array.prototype.slice.call(shelf.children);
    var before = new Map(all.map(function (c) {
      // The current scale, which may be mid-hover.
      var t = getComputedStyle(c).transform;
      return [c, { at: center(c), scale: t === 'none' ? 1 : new DOMMatrix(t).a }];
    }));
    change();
    if (reduce.matches) return;
    all.forEach(function (c) {
      var was = before.get(c), now = center(c);
      var scale = c.classList.contains('is-playing') ? PLAYING : REST;
      var dx = was.at.x - now.x, dy = was.at.y - now.y;
      if (!dx && !dy && was.scale === scale) return;
      c.animate([
        { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + was.scale + ')' },
        { transform: 'scale(' + scale + ')' }
      ], { duration: MOVE_MS, easing: EASE });
    });
  }

  function play(card) {
    var original = cards[card.dataset.work];
    rearrange(function () {
      if (playing) setState(playing, false);
      playing = original;
      setState(original, true);
      if (!phone.matches) shelf.prepend(original);
    });
    scheduleRotation();
  }

  function pause() {
    clearTimeout(rotationTimer);
    var card = playing;
    rearrange(function () { setState(card, false); playing = null; });
  }

  // Anywhere on a card plays it; the playing card's pill pauses it.
  shelf.addEventListener('click', function (event) {
    var card = event.target.closest('.listen-card');
    if (!card) return;
    if (!card.classList.contains('is-playing')) play(card);
    else if (event.target.closest('.listen-card__pill')) pause();
  });

  // ---- Phone loop ----
  // Copies of the cards sit on either side of the originals. Whenever the shelf is at rest it
  // is shifted by whole sets back to the middle, which looks identical, so it never runs out.
  var pos = 0, last = 0, frame = 0, visible = false, touching = false, userUntil = 0;

  function buildCopies() {
    shelf.querySelectorAll('[data-copy]').forEach(function (c) { c.remove(); });
    var originals = Array.prototype.slice.call(shelf.children);
    for (var k = 0; k < COPIES; k++) {
      var set = originals.map(function (c) {
        var copy = c.cloneNode(true);
        copy.dataset.copy = '';
        copy.setAttribute('aria-hidden', 'true');
        copy.querySelector('.listen-card__pill').tabIndex = -1;
        return copy;
      });
      // Half the copies go before the originals, half after.
      if (k < COPIES / 2) shelf.prepend.apply(shelf, set);
      else shelf.append.apply(shelf, set);
    }
  }

  function setWidth() {
    return shelf.children[cards.length].offsetLeft - shelf.children[0].offsetLeft;
  }

  // Keep the scroll position within the middle set.
  function recenter() {
    var w = setWidth();
    if (!w) return;
    var mid = w * (COPIES / 2);
    while (pos < mid - w / 2) pos += w;
    while (pos >= mid + w / 2) pos -= w;
    place();
  }

  // scrollLeft only lands on whole device pixels, which makes a slow drift step at a fraction of
  // the display's refresh rate. Scroll to the nearest pixel and shift the cards by the remainder.
  function place() {
    var whole = Math.round(pos);
    shelf.scrollLeft = whole;
    shelf.style.setProperty('--drift', (whole - pos) + 'px');
  }

  function startPhone() {
    buildCopies();
    pos = setWidth() * (COPIES / 2);
    place();
    run();
  }

  function stopPhone() {
    shelf.querySelectorAll('[data-copy]').forEach(function (c) { c.remove(); });
    cancelAnimationFrame(frame);
    frame = 0;
    shelf.style.removeProperty('--drift');
  }

  shelf.addEventListener('touchstart', function () { touching = true; }, { passive: true });
  shelf.addEventListener('touchend', function () {
    touching = false;
    userUntil = performance.now() + 1200;   // let a fling's momentum finish
  }, { passive: true });
  shelf.addEventListener('scroll', function () {
    if (!phone.matches) return;
    // A swipe moved the shelf: follow it rather than fight it.
    if (Math.abs(shelf.scrollLeft - pos) > 2) {
      pos = shelf.scrollLeft;
      userUntil = Math.max(userUntil, performance.now() + 600);
    }
  }, { passive: true });

  function tick(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    frame = 0;
    if (!phone.matches || !visible) return;
    if (!touching && now > userUntil) {
      if (!reduce.matches) pos += DRIFT * dt;
      recenter();
    }
    frame = requestAnimationFrame(tick);
  }

  function run() {
    if (frame || !phone.matches || !visible) return;
    last = 0;
    frame = requestAnimationFrame(tick);
  }

  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    run();
  }).observe(shelf);

  phone.addEventListener('change', function () {
    if (phone.matches) startPhone();
    else stopPhone();
  });
  if (phone.matches) startPhone();

  scheduleRotation();
})();
