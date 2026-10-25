// Fades sections in as they scroll into view, and plays muted demo videos once each is visible.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canObserve = 'IntersectionObserver' in window;

  var reveals = document.querySelectorAll('.reveal');
  if (!canObserve || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        seen.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { seen.observe(el); });
  }

  var videos = document.querySelectorAll('video[data-play-in-view]');
  if (!canObserve || reduceMotion) return;
  var watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var video = entry.target;
      if (entry.isIntersecting) {
        var played = video.play();
        if (played && played.catch) played.catch(function () {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.4 });
  videos.forEach(function (video) { watcher.observe(video); });
})();

// The Model Tasks card starts with a short practice queue the first time it scrolls into view, so it
// shows the queue at work instead of an idle card.
(function () {
  var demo = document.querySelector('[data-guide-tasks]');
  if (!demo || !('IntersectionObserver' in window)) return;
  var seen = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    seen.disconnect();
    ['question', 'define', 'tree', 'define'].forEach(function (kind, i) {
      setTimeout(function () {
        var button = demo.querySelector('[data-practice="' + kind + '"]');
        if (button) button.click();
      }, 400 + i * 350);
    });
  }, { threshold: 0.4 });
  seen.observe(demo);
})();
