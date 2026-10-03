// Guide page: the topic list marks the topic being read.
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.guide-list a'));
  var topics = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if (!links.length) return;
  function update() {
    var line = window.innerHeight * 0.35, current = -1;
    topics.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < line) current = i; });
    links.forEach(function (a, i) {
      if (i === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// "Show Technical Details" accordions: collapsed by default; the panel's grid rows animate open.
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.guide-tech__toggle'), function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    var label = btn.querySelector('[data-tech-label]');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
      if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
      label.textContent = (open ? 'Hide' : 'Show') + ' Technical Details';
    });
  });
})();
