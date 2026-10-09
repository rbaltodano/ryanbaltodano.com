// Listening shelf on the home page, after the app's Library listening cards. One work is read
// at a time: pressing a card picks up that work where you left off. The card moves to the front
// of the shelf at 1.1x (the rest sit at 0.9x) and swaps its play icon for a ring showing how far through the work you
// are. Every five seconds the next work takes the lead. Pressing its Listen pill again
// pauses the rotation. The shelf rearranges on the app's menu curve.
// Without JS the cards simply rest.
(function () {
  var shelf = document.querySelector('[data-listen-shelf]');
  if (!shelf) return;

  var EASE = 'cubic-bezier(0.55, 0, 0.17, 1)';
  var MOVE_MS = 500;
  var ROTATE_MS = 5000;
  var REST = 0.9, PLAYING = 1.1;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cards = Array.prototype.slice.call(shelf.children);
  var playing = shelf.querySelector('.listen-card.is-playing');
  var rotationTimer;

  function scheduleRotation() {
    clearTimeout(rotationTimer);
    rotationTimer = setTimeout(function () {
      if (!document.hidden) {
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

  function setState(card, on) {
    card.classList.toggle('is-playing', on);
    card.querySelector('.listen-card__pill').setAttribute('aria-pressed', on ? 'true' : 'false');
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
    rearrange(function () {
      if (playing) setState(playing, false);
      playing = card;
      setState(card, true);
      shelf.prepend(card);
    });
    // On phones the shelf scrolls; bring the front card into view. Snapping is off while the
    // cards move, since it would otherwise follow their in-flight positions.
    if (shelf.scrollLeft) {
      shelf.style.scrollSnapType = 'none';
      shelf.scrollTo({ left: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
      // Snap again once the scroll settles (a timer covers browsers without scrollend).
      var deadline = Date.now() + 1500;
      var resnap = function () {
        if (shelf.scrollLeft > 1 && Date.now() < deadline) return;
        shelf.removeEventListener('scrollend', resnap);
        shelf.style.scrollSnapType = '';
      };
      shelf.addEventListener('scrollend', resnap);
      setTimeout(function () { deadline = 0; resnap(); }, 1500);
    }
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
    if (card !== playing) play(card);
    else if (event.target.closest('.listen-card__pill')) pause();
  });

  scheduleRotation();
})();
