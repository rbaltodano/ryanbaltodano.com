// The Features journey. The steps scroll past a pinned app window; whichever step crosses the
// reading line picks the scene in the window and plays its moment: the answer streams in, its
// source opens, a term is defined and saved, the Insight Library opens a card, a branch opens,
// and the Insight Tree cards grow, place a Midpoint, promote a node, and turn in Study.
// The scenes are the existing demos (js/app-windows.js, js/insight-tree.js); this only drives them.
(function () {
  var journey = document.querySelector('[data-journey]');
  if (!journey) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wait = function (ms) { return reduceMotion ? 0 : ms; };

  var steps = Array.prototype.slice.call(journey.querySelectorAll('.journey__step'));
  var stage = journey.querySelector('.journey__stage');
  var scenes = {};
  Array.prototype.forEach.call(journey.querySelectorAll('[data-scene]'), function (scene) { scenes[scene.dataset.scene] = scene; });

  var timers = [];
  function later(ms, fn) { timers.push(setTimeout(fn, wait(ms))); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  // ---------- The conversation: streaming answer, source reader, definition ----------
  var conv = scenes.conversation.querySelector('.window');
  var answer = conv.querySelector('.w-read__answer');
  var reader = conv.querySelector('[data-reader]');
  var cite = conv.querySelector('[data-cite]');
  var defCard = conv.querySelector('[data-card]');
  var save = conv.querySelector('[data-card-save]');

  // Words and inline buttons stream in as units, in reading order.
  var units = [];
  Array.prototype.slice.call(answer.childNodes).forEach(function (node) {
    if (node.nodeType === 3) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var word = document.createElement('span');
        word.className = 'jw';
        word.textContent = part;
        units.push(word);
        frag.appendChild(word);
      });
      node.replaceWith(frag);
    } else if (node.nodeType === 1) {
      node.classList.add('jw');
      units.push(node);
    }
  });
  function showAll() { units.forEach(function (u) { u.classList.add('is-in'); }); }
  function stream() {
    units.forEach(function (u) { u.classList.remove('is-in'); });
    units.forEach(function (u, i) { later(250 + i * 30, function () { u.classList.add('is-in'); }); });
  }
  function openReader() { cite.classList.add('is-active'); reader.classList.remove('is-closed'); }
  function closeReader() { cite.classList.remove('is-active'); reader.classList.add('is-closed'); }
  function closeDefinition() { if (!defCard.classList.contains('is-closed')) conv.click(); }
  cite.addEventListener('click', function (e) {
    e.stopPropagation();
    closeDefinition();
    if (reader.classList.contains('is-closed')) openReader(); else closeReader();
  });
  reader.addEventListener('click', function (e) { e.stopPropagation(); });
  conv.addEventListener('click', closeReader);

  var conversationActions = {
    ask: function () { closeReader(); closeDefinition(); stream(); },
    source: function () { showAll(); closeDefinition(); later(450, openReader); },
    define: function () {
      showAll();
      closeReader();
      later(350, function () {
        var term = conv.querySelector('[data-term="justice"]');
        if (defCard.classList.contains('is-closed') || !term.classList.contains('is-active')) term.click();
      });
      later(2100, function () { if (save.getAttribute('aria-pressed') !== 'true') save.click(); });
    }
  };

  // ---------- The other scenes ----------
  var played = {};
  function click(scene, selector) { var el = scenes[scene].querySelector(selector); if (el) el.click(); }
  function playTree(scene) { scenes[scene].querySelector('[data-insight-tree]').dispatchEvent(new Event('journey:play')); }
  var sceneActions = {
    library: function () { later(500, function () { click('library', '[data-insight="distributive"]'); }); },
    branches: function () {
      click('branches', '[data-branch-back]');
      later(700, function () { click('branches', '[data-branch-open]'); });
    },
    grow: function () { playTree('grow'); },
    midpoint: function () { playTree('midpoint'); },
    'make-node': function () {
      if (played['make-node']) return;
      played['make-node'] = true;
      later(700, function () { click('make-node', '[data-make]'); });
    },
    study: function () { playTree('study'); },
    home: function () {}
  };

  // ---------- Which step is being read ----------
  var active = null, inView = false, pending = false;
  function activate(step) {
    if (step === active) return;
    var previous = active;
    active = step;
    steps.forEach(function (s) { s.classList.toggle('is-active', s === step); });
    var name = step.dataset.show;
    Object.keys(scenes).forEach(function (key) {
      scenes[key].classList.toggle('is-active', key === name);
      scenes[key].setAttribute('aria-hidden', key === name ? 'false' : 'true');
    });
    if (inView) run(step, previous);
  }
  function run(step, previous) {
    clearTimers();
    var name = step.dataset.show;
    if (name === 'conversation') conversationActions[step.dataset.state]();
    else if (sceneActions[name]) sceneActions[name](previous);
  }
  function readingLine() {
    var vh = window.innerHeight;
    if (window.matchMedia('(max-width: 1024px)').matches) {
      // Stacked: the window is pinned on top, so read against the space below it.
      var below = Math.max(stage.getBoundingClientRect().bottom, 0);
      return below + (vh - below) * 0.35;
    }
    return vh * 0.55;
  }
  function update() {
    pending = false;
    var line = readingLine();
    var current = steps[0];
    steps.forEach(function (s) { if (s.getBoundingClientRect().top < line) current = s; });
    activate(current);
  }
  function request() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);

  new IntersectionObserver(function (entries) {
    var was = inView;
    inView = entries[0].isIntersecting;
    if (inView && !was && active) run(active, null);
  }, { threshold: 0.2 }).observe(stage);
  update();
})();
