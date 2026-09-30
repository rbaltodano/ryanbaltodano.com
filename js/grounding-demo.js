// Sources demo in the home page's Library section.
//
// Ten retrieved sources spring in as plain titles, "Writing Response..." shows for three seconds,
// then each title morphs into that work's Library card and the stack scrolls in a seamless loop.
// Ported from the app (Aquinas-iOS-main):
//   - InsightTreeCanvasView      an Insight's entrance: springRelaxed (response 0.5, damping 0.8)
//                                from 88% scale and 24 pt lower, used here without the blur
//   - WritingResponseQuill       2 s cycle: the quill rocks ±4° and travels right, then returns
//   - LibrarySearchResultCard    the card each source becomes (light theme)
// Works, subjects, and passage counts come from the app's bundled corpus. The sequence is an
// illustration, not live retrieval. Without JS or with reduced motion the cards simply rest.
(function () {
  var root = document.querySelector('[data-grounding-demo]');
  if (!root) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var track = root.querySelector('[data-g-track]');
  var writing = root.querySelector('[data-g-writing]');
  var quill = root.querySelector('[data-g-quill]');
  var works = Array.prototype.slice.call(track.children);

  var STAGGER = 150;          // between sources
  var WRITING_GAP = 300;      // after the last source starts
  var WRITING_FOR = 3000;
  var MORPH = 700;            // matches the CSS transitions on .work

  // Each title sits centered while it is a plain source row, then slides to the card's left edge.
  function centerTitles() {
    works.forEach(function (work) {
      var sans = work.querySelector('.work__sans');
      var style = getComputedStyle(work);
      var inner = work.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      work.style.setProperty('--cx', Math.max(0, (inner - sans.offsetWidth) / 2).toFixed(1) + 'px');
    });
  }

  // springRelaxed sampled into keyframes, so the entrance overshoots and settles as in the app.
  function springFrames() {
    var k = Math.pow(2 * Math.PI / 0.5, 2), c = 2 * 0.8 * Math.sqrt(k);
    var v = 0, vel = 0, frames = [], steps = 48, h = 1 / 240;
    for (var i = 0; i <= steps; i++) {
      frames.push({
        opacity: Math.min(1, Math.max(0, v)),
        transform: 'translateY(' + ((1 - v) * 24).toFixed(2) + 'px) scale(' + (0.88 + 0.12 * v).toFixed(4) + ')'
      });
      for (var s = 0; s < 5; s++) { vel += (-k * (v - 1) - c * vel) * h; v += vel * h; }
    }
    frames[steps] = { opacity: 1, transform: 'translateY(0px) scale(1)' };
    return frames;
  }

  var quillFrame = 0;
  function animateQuill(now) {
    var progress = (now / 1000 % 2) / 2;
    var angle = Math.sin(progress * 2 * Math.PI * 6) * 4;
    var travel = (progress < 0.833 ? progress / 0.833 : (1 - progress) / 0.167) * 26;
    var bob = Math.abs(Math.sin(progress * 2 * Math.PI * 7.2)) * 2;
    quill.style.transform = 'translate(' + (travel * 0.28).toFixed(2) + 'px,' + (bob * 0.35).toFixed(2) + 'px) rotate(' + angle.toFixed(2) + 'deg)';
    quillFrame = requestAnimationFrame(animateQuill);
  }

  function play() {
    var frames = springFrames();
    root.classList.remove('is-pre');
    works.forEach(function (work, index) {
      work.animate(frames, { duration: 1000, delay: index * STAGGER, fill: 'both' });
    });

    var writingAt = (works.length - 1) * STAGGER + WRITING_GAP;
    setTimeout(function () {
      writing.hidden = false;
      writing.classList.add('glide-in');
      quillFrame = requestAnimationFrame(animateQuill);
    }, writingAt);

    setTimeout(function () {
      writing.classList.add('is-leaving');
      root.classList.remove('is-rows');
    }, writingAt + WRITING_FOR);

    // Once the cards have settled, a second copy follows the first so the loop has no seam.
    setTimeout(function () {
      cancelAnimationFrame(quillFrame);
      writing.hidden = true;
      works.forEach(function (work) {
        var copy = work.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      });
      root.classList.add('is-scrolling');
    }, writingAt + WRITING_FOR + MORPH);
  }

  // Start as plain, hidden source rows. The switch itself must not animate.
  root.classList.add('is-static', 'is-rows', 'is-pre');
  centerTitles();
  void root.offsetHeight;
  root.classList.remove('is-static');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(centerTitles);
  window.addEventListener('resize', centerTitles);

  // Play once, the first time the card is properly on screen.
  var observer = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    play();
  }, { threshold: 0.45 });
  observer.observe(root);
})();
