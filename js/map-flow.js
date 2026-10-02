// "A Map of Your Own Thinking" on the home page. The photo panel pins while the page scrolls,
// and the scroll drives a horizontal track through three frames, right to left: an answer
// streams in, one of its terms arrives as a saved Insight card (the app's dark docked card),
// then the Insight Tree adds that Insight with the app's entrance (insight-tree.js, mode "add").
// Each frame rests a moment before the next slides in.
(function () {
  var flow = document.querySelector('[data-flow]');
  if (!flow) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sticky = flow.querySelector('.flow__sticky');
  var track = flow.querySelector('[data-flow-track]');
  var frames = Array.prototype.slice.call(track.children);
  var text = flow.querySelector('[data-flow-text]');
  var insight = flow.querySelector('[data-flow-insight]');
  var tree = flow.querySelector('[data-insight-tree]');

  // Scroll needed per frame of travel, as a share of the viewport height.
  var PER_FRAME = 0.9;
  // Scroll progress (0–1) → track position (0 = first frame, 2 = last), with rests between.
  var STOPS = [[0, 0], [0.16, 0], [0.42, 1], [0.58, 1], [0.84, 2], [1, 2]];
  function position(p) {
    for (var i = 1; i < STOPS.length; i++) {
      if (p <= STOPS[i][0]) {
        var a = STOPS[i - 1], b = STOPS[i];
        var t = (p - a[0]) / (b[0] - a[0] || 1);
        t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return 2;
  }

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
  function playAnswer() {
    if (played.answer) return;
    played.answer = true;
    words.forEach(function (word, i) { setTimeout(function () { word.classList.add('is-in'); }, reduceMotion ? 0 : 200 + i * 40); });
    setTimeout(function () { text.classList.add('is-marked'); }, reduceMotion ? 0 : 400 + words.length * 40);
  }
  function playInsight() { if (!played.insight) { played.insight = true; insight.classList.add('is-in'); } }
  function playTree() { if (!played.tree) { played.tree = true; tree.dispatchEvent(new Event('journey:play')); } }

  // ---------- Scroll → track ----------
  function layout() {
    flow.style.height = (sticky.offsetHeight + 2 * PER_FRAME * window.innerHeight) + 'px';
    update();
  }
  var pending = false;
  function update() {
    pending = false;
    var top = parseFloat(getComputedStyle(sticky).top) || 0;
    var travel = flow.offsetHeight - sticky.offsetHeight;
    var p = Math.min(Math.max((top - flow.getBoundingClientRect().top) / travel, 0), 1);
    var x = position(p);
    track.style.transform = 'translate3d(' + (-x * 100 / frames.length).toFixed(3) + '%,0,0)';
    frames.forEach(function (frame, i) { frame.classList.toggle('is-active', Math.abs(x - i) < 0.85); });
    var r = sticky.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.6 && r.bottom > 0) playAnswer();
    if (Math.abs(x - 1) < 0.3) playInsight();
    if (Math.abs(x - 2) < 0.3) playTree();
  }
  function request() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', layout);
  layout();
})();
