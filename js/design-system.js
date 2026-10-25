// Fonts & colors: pressing the deck moves the front color card to the back, and the rest step forward.
(function () {
  var stack = document.querySelector('[data-swatch-stack]');
  if (!stack) return;
  var cards = Array.prototype.slice.call(stack.querySelectorAll('[data-swatch]'));
  function place() {
    cards.forEach(function (card, i) {
      card.style.setProperty('--i', i);
      card.classList.toggle('is-front', i === 0);
    });
  }
  function next() { cards.push(cards.shift()); place(); }
  place();
  stack.addEventListener('click', next);
  stack.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
  });
})();
