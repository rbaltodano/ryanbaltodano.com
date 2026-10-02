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
