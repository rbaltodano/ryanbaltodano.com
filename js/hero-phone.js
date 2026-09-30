// Live hero on the home page. The floating card poses a question, the phone streams the answer
// word by word (the app's streamed-response motion), its two key terms underline, and they
// float out beside the phone as saved Insights. Then the next question takes its place.
// An illustration, not live inference. Without JS or with reduced motion the first answer rests.
(function () {
  var scene = document.querySelector('[data-hero-scene]');
  if (!scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var q = function (name) { return scene.querySelector('[data-hero-' + name + ']'); };
  var question = q('question'), response = q('response'), title = q('title'), answer = q('answer');
  var card = q('card'), status = q('status'), spinner = q('spinner');
  var show = scene.querySelector('.phone-app__show');
  var tags = Array.prototype.slice.call(scene.querySelectorAll('[data-hero-tag]'));

  var conversations = [
    {
      question: 'What does it mean for knowledge to become wisdom?',
      title: 'Knowledge and Wisdom',
      answer: answer.innerHTML,
      insights: ['Thomism', 'Eudaimonia']
    },
    {
      question: 'Is mercy ever unjust?',
      title: 'Mercy and Justice',
      answer: 'Not for Aquinas. <b>Justice</b> gives each person what they are due. Mercy does not take that away; it gives more than is owed. So mercy goes beyond justice without working against it, and both serve <b>charity</b>.',
      insights: ['Justice', 'Charity']
    }
  ];

  var WORD_STAGGER = 45;   // between streamed words
  var HOLD = 4800;         // the finished answer rests before the next question
  var index = 0, visible = true, timers = [];
  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }

  // Wrap each word so it can stream in, keeping the bold terms intact.
  function wrapWords(el) {
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var span = document.createElement('span');
            span.className = 'pw';
            span.textContent = part;
            words.push(span);
            frag.appendChild(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) { walk(child); }
      });
    })(el);
    return words;
  }

  function setStatus(thinking) {
    status.textContent = thinking ? 'Thinking...' : 'Idle';
    spinner.classList.toggle('is-paused', !thinking);
  }

  function play() {
    var c = conversations[index];
    index = (index + 1) % conversations.length;

    question.textContent = c.question;
    card.textContent = '“' + c.question + '”';
    title.textContent = c.title;
    answer.innerHTML = c.answer;
    tags.forEach(function (tag, i) { tag.querySelector('span').textContent = c.insights[i]; });
    var words = wrapWords(answer);
    var terms = Array.prototype.slice.call(answer.querySelectorAll('b'));

    // The question arrives, and the model starts thinking.
    later(60, function () {
      question.classList.remove('is-out');
      card.classList.remove('is-out');
      response.style.opacity = 1;
    });
    later(500, function () { setStatus(true); });
    later(1500, function () { show.classList.remove('is-out'); title.classList.remove('is-out'); });

    // The answer streams.
    var streamAt = 1850;
    words.forEach(function (word, i) {
      later(streamAt + i * WORD_STAGGER, function () { word.classList.add('is-in'); });
    });
    var doneAt = streamAt + words.length * WORD_STAGGER + 600;
    later(doneAt, function () { setStatus(false); });

    // Its terms underline, then float out as saved Insights.
    terms.forEach(function (term, i) {
      later(doneAt + 250 + i * 220, function () { term.classList.add('is-marked'); });
    });
    tags.forEach(function (tag, i) {
      later(doneAt + 900 + i * 180, function () { tag.classList.remove('is-out'); });
    });

    // Clear the stage for the next question.
    later(doneAt + 900 + HOLD, function () {
      [question, card, show, title].concat(tags).forEach(function (el) { el.classList.add('is-out'); });
      response.style.opacity = 0;
    });
    later(doneAt + 900 + HOLD + 550, next);
  }

  function next() {
    timers = [];
    if (visible) play(); else waiting = true;
  }
  var waiting = false;

  // Start hidden, then play. The loop rests while the hero is off screen.
  scene.classList.add('is-booting', 'is-live');
  [question, card, show, title].concat(tags).forEach(function (el) { el.classList.add('is-out'); });
  response.style.opacity = 0;
  setStatus(false);
  void scene.offsetHeight;
  scene.classList.remove('is-booting');
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible && waiting) { waiting = false; play(); }
  }, { threshold: 0.2 }).observe(scene);
  later(350, play);
})();
