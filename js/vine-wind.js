// Vines blowing in the wind (the sprite sheets in assets/home/): each plays only while it is on
// screen, so a page parked elsewhere is not animating in the background.
(function () {
  var vines = document.querySelectorAll('.hero__vine--wind img');
  if (!vines.length || !('IntersectionObserver' in window)) return;
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
    });
  });
  Array.prototype.forEach.call(vines, function (img) { seen.observe(img.parentNode); });
})();
