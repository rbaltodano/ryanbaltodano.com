// Privacy page: a question asked in airplane mode and answered on the device. The answer streams
// in word by word, then chips mark what did and didn't happen. Two questions alternate.
// An illustration, not live inference. Without JS or with reduced motion the first one rests.
(function () {
  var demo = document.querySelector('[data-offline-demo]');
  if (!demo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var question = demo.querySelector('[data-od-question]');
  var answer = demo.querySelector('[data-od-answer]');
  var chips = Array.prototype.slice.call(demo.querySelectorAll('[data-od-chip]'));
  var exchanges = [
    { q: question.textContent, a: answer.textContent },
    { q: 'Can I believe in God and still have doubts?',
      a: 'Many have. Augustine’s Confessions is largely a record of searching, and Aquinas held that faith and reason each have their own work to do. Doubt can be a reason to look more closely rather than to stop.' }
  ];
  var index = 0, visible = false, waiting = true;

  function hideAll() {
    [question, answer].concat(chips).forEach(function (el) { el.classList.add('od-out'); });
  }
  function play() {
    var ex = exchanges[index];
    index = (index + 1) % exchanges.length;
    question.textContent = ex.q;
    answer.innerHTML = '';
    var words = ex.a.split(' ').map(function (text, i) {
      var word = document.createElement('span');
      word.className = 'od-word';
      word.textContent = text;
      answer.appendChild(word);
      if (i < ex.a.split(' ').length - 1) answer.appendChild(document.createTextNode(' '));
      return word;
    });

    setTimeout(function () { question.classList.remove('od-out'); }, 100);
    setTimeout(function () { answer.classList.remove('od-out'); }, 1000);
    var start = 1300;
    words.forEach(function (word, i) { setTimeout(function () { word.classList.add('is-in'); }, start + i * 50); });
    var done = start + words.length * 50 + 400;
    chips.forEach(function (chip, i) { setTimeout(function () { chip.classList.remove('od-out'); }, done + i * 220); });
    setTimeout(hideAll, done + 5200);
    setTimeout(function () {
      if (visible) play(); else waiting = true;
    }, done + 5800);
  }

  demo.classList.add('is-booting', 'is-live');
  hideAll();
  void demo.offsetHeight;
  demo.classList.remove('is-booting');
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible && waiting) { waiting = false; play(); }
  }, { threshold: 0.35 }).observe(demo);
})();
