// The design-system section: Light and Dark swap every token to its other value, a swatch copies its
// hex when pressed, and the type scale rows share one editable line so any edit previews in every style.
(function () {
  var ds = document.querySelector('[data-ds]');
  if (!ds) return;

  var toggles = ds.querySelectorAll('[data-mode-set]');
  toggles.forEach(function (button) {
    button.addEventListener('click', function () {
      ds.dataset.mode = button.dataset.modeSet;
      toggles.forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
    });
  });

  ds.querySelectorAll('.ds-swatch').forEach(function (swatch) {
    var hexEl = swatch.querySelector('.ds-swatch__hex');
    var timer = null;
    swatch.addEventListener('click', function () {
      var hex = swatch.dataset[ds.dataset.mode === 'dark' ? 'dark' : 'light'];
      var done = function () {
        swatch.classList.add('is-copied');
        hexEl.dataset.copied = 'Copied ' + hex;
        clearTimeout(timer);
        timer = setTimeout(function () { swatch.classList.remove('is-copied'); }, 1400);
      };
      try { navigator.clipboard.writeText(hex).then(done, function () {}); } catch (e) {}
    });
  });

  var samples = ds.querySelectorAll('[data-sample]');
  var MAX = 60;
  samples.forEach(function (sample) {
    sample.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); sample.blur(); } });
    sample.addEventListener('input', function () {
      var text = sample.textContent.replace(/\s+/g, ' ');
      if (text.length > MAX) { text = text.slice(0, MAX); sample.textContent = text; }
      samples.forEach(function (other) { if (other !== sample) other.textContent = text; });
    });
    sample.addEventListener('blur', function () {
      if (sample.textContent.trim()) return;
      samples.forEach(function (other) { other.textContent = 'What do we owe each other?'; });
    });
  });
})();
