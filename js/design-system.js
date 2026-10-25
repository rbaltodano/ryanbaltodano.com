// Fonts & colors: pressing a color chip copies its hex, and the chip's label reads "Copied" briefly.
(function () {
  document.querySelectorAll('.ds-chip').forEach(function (chip) {
    var hex = chip.querySelector('.ds-chip__hex'), timer = null;
    chip.addEventListener('click', function () {
      var value = chip.dataset.hex;
      try {
        navigator.clipboard.writeText(value).then(function () {
          chip.classList.add('is-copied');
          hex.textContent = 'Copied';
          clearTimeout(timer);
          timer = setTimeout(function () { chip.classList.remove('is-copied'); hex.textContent = value; }, 1400);
        }, function () {});
      } catch (e) {}
    });
  });
})();
