// Website startup mirrors the app's BootPresentation, using its real dots and five leaf frames.
// Wait only for first-screen assets; unrelated images further down the page do not hold it open.
(function () {
  var root = document.documentElement;
  var boot = document.querySelector('.site-boot');
  if (!boot || !root.classList.contains('is-booting')) return;

  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var leaf = boot.querySelector('.site-boot__leaf');
  document.querySelectorAll('body > .nav, body > main, body > .footer').forEach(function (element) {
    if (element.inert) return;
    element.inert = true;
    element.setAttribute('data-boot-inert', '');
  });

  function pause(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
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
    if (!root.classList.contains('is-booting')) return;
    boot.classList.add('is-visible');
    if (motion.matches) return;
    // The leaf sharpens for 0.5 s, then each app sprite holds for 0.24 s.
    await pause(500);
    for (var stage = 0; stage < 5; stage++) {
      if (!root.classList.contains('is-booting') || motion.matches) return;
      leaf.style.backgroundPosition = (stage * 25) + '% 0';
      await pause(240);
    }
  });

  var assets = Array.prototype.map.call(document.querySelectorAll('.hero-phone img'), imageReady);
  assets.push(window.vineEntranceReady || Promise.resolve());
  assets.push(document.fonts ? document.fonts.ready : Promise.resolve());
  assets.push(growing);
  Promise.all(assets).then(async function () {
    if (!root.classList.contains('is-booting')) return;
    boot.classList.add('is-leaving');
    if (!motion.matches) await pause(500);
    window.releaseSiteBoot(false);
  });
})();
