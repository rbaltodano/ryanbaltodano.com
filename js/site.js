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

