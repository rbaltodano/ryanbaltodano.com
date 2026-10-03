// Website startup mirrors the app's BootPresentation, using its real dots and five leaf frames.
// Wait only for first-screen assets; unrelated images further down the page do not hold it open.
(function () {
  var root = document.documentElement;
  var boot = document.querySelector('.site-boot');
  if (!boot || !root.classList.contains('is-booting')) return;

  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var leaf = boot.querySelector('.site-boot__leaf');
  var progress = boot.querySelector('.site-boot__progress');
  var downloads = window.siteAssetDownloads;
  var lastPercent = 0;
  var nativeCompleted = 0;
  var images = Array.prototype.slice.call(document.querySelectorAll('img[data-boot-src]'));

  function showPercent(percent) {
    lastPercent = Math.max(lastPercent, percent);
    progress.textContent = lastPercent + '%';
    progress.setAttribute('aria-valuenow', lastPercent);
  }
  function armStallDeadline() {
    clearTimeout(window.siteBootDeadline);
    // Keep waiting while bytes arrive, regardless of total transfer time. Release only
    // after a genuinely stalled download or initialization, not after eight seconds.
    window.siteBootDeadline = setTimeout(function () { window.releaseSiteBoot(true); }, 15000);
  }
  function updateProgress() {
    if (!root.classList.contains('is-booting')) return;
    var fraction = downloads ? downloads.progress() : nativeCompleted / images.length;
    showPercent(Math.min(99, Math.floor(fraction * 100)));
    armStallDeadline();
  }
  window.addEventListener('site:asset-progress', updateProgress);
  updateProgress();
  window.addEventListener('site:ready', function () {
    window.removeEventListener('site:asset-progress', updateProgress);
  }, { once: true });
  document.querySelectorAll('body > .nav, body > main, body > .footer').forEach(function (element) {
    if (element.inert) return;
    element.inert = true;
    element.setAttribute('data-boot-inert', '');
  });

  function pause(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function paintedFrame() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () { requestAnimationFrame(resolve); });
    });
  }
  function imageReady(image) {
    if (image.decode) return image.decode().catch(function () {});
    if (image.complete) return Promise.resolve();
    return new Promise(function (resolve) {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }

  var leafSheet = new Image();
  leafSheet.src = 'assets/brand/boot-leaf.webp';
  var markReady = Promise.all([imageReady(leafSheet), imageReady(boot.querySelector('img'))]);
  var growing = markReady.then(async function () {
    // Cached images can resolve before the browser paints the initial opacity of zero.
    // Give that state a frame before fading in, so the entrance always animates.
    await paintedFrame();
    if (!root.classList.contains('is-booting')) return;
    // Establish the transparent style even when cached resources resolve before first paint.
    void getComputedStyle(boot.querySelector('.site-boot__mark')).opacity;
    void getComputedStyle(leaf).filter;
    boot.classList.add('is-visible');
    // The leaf sharpens for 0.5 s, then each app sprite holds for 0.24 s.
    await pause(500);
    if (motion.matches) return;
    for (var stage = 0; stage < 5; stage++) {
      if (!root.classList.contains('is-booting') || motion.matches) return;
      leaf.style.backgroundPosition = (stage * 25) + '% 0';
      await pause(240);
    }
  });

  var assets = images.map(function (image) {
    var src = image.getAttribute('data-boot-src');
    var downloaded = downloads ? downloads.get(src) : Promise.resolve(src);
    return downloaded.then(function (url) {
      if (!url) {
        if (!image.getAttribute('src')) {
          image.removeAttribute('data-boot-src');
          image.style.display = 'none';
        }
        return;
      }
      image.src = url;
      return imageReady(image);
    }).then(function () { nativeCompleted++; updateProgress(); });
  });
  assets.push(window.vineEntranceReady || Promise.resolve());
  assets.push(document.fonts ? document.fonts.ready : Promise.resolve());
  assets.push(growing);
  Promise.all(assets).then(async function () {
    if (!root.classList.contains('is-booting')) return;
    // 100% means both downloaded and decoded, with the entrance prepared to start.
    showPercent(100);
    void getComputedStyle(boot.querySelector('.site-boot__mark')).opacity;
    void getComputedStyle(leaf).filter;
    boot.classList.add('is-leaving');
    await pause(500);
    window.releaseSiteBoot(false);
  });
})();
