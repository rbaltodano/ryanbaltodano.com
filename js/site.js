// Site-wide behavior: the mobile nav menu, smooth scrolling, and headline reveals.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  // ---------- Smooth scrolling ----------
  // Wheel and trackpad input sets a target and the page eases toward it, so scrolling glides
  // instead of stepping. Touch, keyboard, the scrollbar, and anchor links stay native, and the
  // target re-syncs whenever one of them moves the page.
  if (!reduceMotion) {
    var EASE = 0.11;              // share of the remaining distance covered each frame
    var target = window.scrollY, current = window.scrollY, gliding = false;
    var limit = function () { return document.documentElement.scrollHeight - window.innerHeight; };
    function glide() {
      current += (target - current) * EASE;
      if (Math.abs(target - current) < 0.4) { current = target; gliding = false; }
      window.scrollTo({ top: current, behavior: 'instant' });
      if (gliding) requestAnimationFrame(glide);
    }
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // zoom, sideways
      e.preventDefault();
      if (!gliding) { target = current = window.scrollY; }
      var delta = e.deltaY * (e.deltaMode === 1 ? 36 : e.deltaMode === 2 ? window.innerHeight : 1);
      target = Math.max(0, Math.min(limit(), target + delta));
      if (!gliding) { gliding = true; requestAnimationFrame(glide); }
    }, { passive: false });
    // A press, key, or anchor jump takes over at once: drop any glide in progress.
    ['pointerdown', 'keydown', 'touchstart', 'hashchange'].forEach(function (type) {
      window.addEventListener(type, function () { gliding = false; }, { passive: true });
    });
  }

  // ---------- Headline reveal ----------
  // Each word of a headline resolves from a blur, in order, the first time it comes into view.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var headlines = document.querySelectorAll('h1.display, h2.display, .row__copy h2, .cta__copy h2');
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        seen.unobserve(entry.target);
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(headlines, function (headline) {
      var count = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              var word = document.createElement('span');
              word.className = 'rw';
              word.style.setProperty('--i', count++);
              word.textContent = part;
              frag.appendChild(word);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') { walk(child); }
        });
      })(headline);
      headline.classList.add('reveal');
      seen.observe(headline);
    });
  }
})();
