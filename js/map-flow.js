// "A Map of Your Own Thinking" on the home page. The photo panel pins while the page scrolls,
// and the scroll drives a horizontal track through three frames, right to left, 1:1: an answer
// streams in, one of its terms arrives as a saved Insight card (the app's dark docked card),
// the Insight Tree adds that Insight with the app's entrance (insight-tree.js, mode "add"),
// and the same tree swings into Study in place.
// On tablets and phones the frames rise bottom to top instead of sliding sideways.
(function () {
  var flow = document.querySelector('[data-flow]');
  if (!flow) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sticky = flow.querySelector('.flow__sticky');
  var track = flow.querySelector('[data-flow-track]');
  var frames = Array.prototype.slice.call(track.children);
  var text = flow.querySelector('[data-flow-text]');
  var insight = flow.querySelector('[data-flow-insight]');
  var definitionTimer;
  var scrollAnimation;
  var animationStart = 0;
  var animating = false;
  var terms = flow.querySelectorAll('[data-flow-term]');
  var menuCurve = getComputedStyle(flow).getPropertyValue('--ease-menu').match(/[\d.]+/g).map(Number);

  // Solve the x coordinate of cubic-bezier(0.55, 0, 0.17, 1) to get its y progress.
  function scrollEase(progress) {
    var low = 0, high = 1, t;
    for (var i = 0; i < 20; i++) {
      t = (low + high) / 2;
      var x = 3 * (1 - t) * (1 - t) * t * menuCurve[0] + 3 * (1 - t) * t * t * menuCurve[2] + t * t * t;
      if (x < progress) low = t; else high = t;
    }
    return 3 * (1 - t) * (1 - t) * t * menuCurve[1] + 3 * (1 - t) * t * t * menuCurve[3] + t * t * t;
  }
  function scrollGeometry() {
    var top = parseFloat(getComputedStyle(sticky).top) || 0;
    var origin = window.scrollY + flow.getBoundingClientRect().top - top;
    var travel = flow.offsetHeight - sticky.offsetHeight;
    return { origin: origin, travel: travel, progress: (window.scrollY - origin) / travel };
  }
  function stopAnimation() {
    cancelAnimationFrame(scrollAnimation);
    animating = false;
  }
  function scrollToPhase(targetPhase) {
    stopAnimation();
    var from = window.scrollY;
    var geometry = scrollGeometry(), origin = geometry.origin, travel = geometry.travel;
    var rest = targetPhase / last;
    var destination = origin + travel * rest;
    if (reduceMotion) { window.scrollTo({ top: destination, behavior: 'instant' }); update(); return; }
    var fromPhase = position(Math.min(Math.max((from - origin) / travel, 0), 1));
    var start = performance.now();
    animating = true;
    animationStart = start;
    function frame(now) {
      var progress = Math.min((now - start) / 500, 1);
      // Animate the visible panel with the menu curve, then invert the scroll mapping.
      // This avoids applying the manual-scroll pauses and easing a second time.
      var phase = fromPhase + (targetPhase - fromPhase) * scrollEase(progress);
      var low = 0, high = 1;
      for (var i = 0; i < 24; i++) {
        var p = (low + high) / 2;
        if (position(p) < phase) low = p; else high = p;
      }
      window.scrollTo({ top: progress === 1 ? destination : origin + travel * (low + high) / 2, behavior: 'instant' });
      update();
      if (progress < 1) scrollAnimation = requestAnimationFrame(frame);
      else animating = false;
    }
    scrollAnimation = requestAnimationFrame(frame);
  }
  // Let direct user input take over from the automatic scroll.
  ['pointerdown', 'touchstart'].forEach(function (event) {
    window.addEventListener(event, stopAnimation, { passive: true });
  });
  // Any direct input hands control back to the user.
  ['wheel', 'keydown'].forEach(function (event) {
    window.addEventListener(event, stopAnimation, { passive: true });
  });
  var definitions = {
    eudaimonia: ['Eudaimonia', 'Flourishing: the complete, well-lived human life that Aristotle held every action ultimately aims at. Not a feeling of happiness, but a life lived well over its whole length.'],
    'natural-philosophy': ['Natural philosophy', 'The study of nature and how things change, understood through their causes and ends. Aristotle’s ethics builds on this account of human nature to ask what it means for a person to live well.']
  };
  var tree = flow.querySelector('[data-scene="tree"] [data-insight-tree]');
  // Four narrative phases share three panels: the last phase morphs the existing tree.
  var phaseCount = 4;
  var last = phaseCount - 1;
  var vertical = window.matchMedia('(max-width: 1024px)');

  // Scroll needed per frame of travel, as a share of the viewport height.
  var PER_FRAME = 0.9;
  // Scroll progress (0–1) → track position (0 = first frame, last = final frame), 1:1 after the hold.
  // The answer holds still for the first stretch of scroll, so the move to the Insight card is deliberate.
  var HOLD = 0.1;
  function position(p) { return Math.max(0, p - HOLD) / (1 - HOLD) * last; }

  // ---------- The answer streams in, then its terms underline ----------
  var words = [];
  (function wrap(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var word = document.createElement('span');
          word.className = 'fw';
          word.textContent = part;
          words.push(word);
          frag.appendChild(word);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) { wrap(child); }
    });
  })(text);
  var played = {};
  var treeShown = false;
  function playAnswer() {
    if (played.answer) return;
    played.answer = true;
    words.forEach(function (word, i) { setTimeout(function () { word.classList.add('is-in'); }, reduceMotion ? 0 : 200 + i * 40); });
    setTimeout(function () { text.classList.add('is-marked'); }, reduceMotion ? 0 : 400 + words.length * 40);
  }
  function playInsight() { if (!played.insight) { played.insight = true; insight.classList.add('is-in'); } }
  // Choosing a term swaps in its own card, which animates in again like the first one.
  function showInsight(definition) {
    insight.classList.add('is-reset');
    insight.classList.remove('is-in');
    insight.querySelector('.flow-insight__title').textContent = definition[0];
    insight.querySelector('.flow-insight__body').textContent = definition[1];
    void insight.offsetWidth;
    insight.classList.remove('is-reset');
    played.insight = true;
    insight.classList.add('is-in');
  }
  function playCard(name, card) { if (!played[name]) { played[name] = true; card.dispatchEvent(new Event('journey:play')); } }

  // A tap generates the chosen definition before advancing to the Insight panel. Without
  // a tap, the original Eudaimonia card remains the scroll-driven default.
  terms.forEach(function (term) {
    term.addEventListener('click', function () {
      clearTimeout(definitionTimer);
      stopAnimation();
      var definition = definitions[term.dataset.flowTerm];
      // Restart the gradient when another term is chosen during generation.
      terms.forEach(function (item) { item.classList.remove('is-generating'); });
      void term.offsetWidth;
      term.classList.add('is-generating');
      text.setAttribute('aria-busy', 'true');
      definitionTimer = setTimeout(function () {
        term.classList.remove('is-generating');
        text.setAttribute('aria-busy', 'false');
        tree.dispatchEvent(new CustomEvent('journey:insight', { detail: { key: term.dataset.flowTerm } }));
        showInsight(definition);
                scrollToPhase(1);
      }, reduceMotion ? 0 : 2000);
    });
  });

  // ---------- Scroll → track ----------
  function layout() {
    flow.style.height = (sticky.offsetHeight + last * PER_FRAME * window.innerHeight) + 'px';
    update();
  }
  var pending = false;
  function update() {
    pending = false;
    var top = parseFloat(getComputedStyle(sticky).top) || 0;
    var travel = flow.offsetHeight - sticky.offsetHeight;
    var p = Math.min(Math.max((top - flow.getBoundingClientRect().top) / travel, 0), 1);
    var phase = position(p);
    var x = Math.min(phase, frames.length - 1);
    // Right to left on wide screens; bottom to top on tablets and phones (the CSS stacks the track).
    var shift = (-x * 100 / frames.length).toFixed(3) + '%';
    track.style.transform = vertical.matches ? 'translate3d(0,' + shift + ',0)' : 'translate3d(' + shift + ',0,0)';
    frames.forEach(function (frame, i) { frame.classList.toggle('is-active', Math.abs(x - i) < 0.85); });
    var r = sticky.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.6 && r.bottom > 0) playAnswer();
    if (Math.abs(x - 1) < 0.3) playInsight();
    if (x > 1.3) tree.parentNode.classList.add('is-seen');
    if (x > 1.7) {
      playCard('tree', tree);
      if (!treeShown) { treeShown = true; tree.dispatchEvent(new Event('journey:visible')); }
    } else treeShown = false;
    tree.dispatchEvent(new CustomEvent('journey:study-progress', {
      detail: { progress: reduceMotion ? (phase >= 2.5 ? 1 : 0) : Math.max(0, phase - 2) }
    }));
  }
  function request() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', layout);
  layout();
})();
