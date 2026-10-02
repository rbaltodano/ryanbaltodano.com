// Live app windows on the internal pages. Each [data-window] is a small working view of an
// Aquinas feature, modeled on the app's own behavior:
//   conversation   underlined terms open a docked definition card (DockedInsightCards); the dock
//                  reads Thinking while it's generated, then shows Select / Quote
//   branches       a quoted concept opens a new branch beside the main line
//   library-insights  saved Insights, with every context a term was saved from
//   home           Question of the Day and the four discovery cards
//   tasks          the Model Tasks queue: one task at a time, upcoming tasks removable
//   library        search across the 37 works
//   global         the global tree only updates when you accept the prompt
//   make-node      promote an Insight; three children splay out from it
//   grounded       a citation opens the passage reader
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wait = function (ms) { return reduceMotion ? 0 : ms; };

  // InsightConnectorLine: a new connector draws itself out from its start (the Node Concept)
  // to the chip over 0.55 s, quick out of the node with a long, soft settle (ease-out quint).
  var CONNECTOR_GROW = 550;
  function growLine(line) {
    hideLine(line);
    var x1 = +line.getAttribute('x1'), y1 = +line.getAttribute('y1');
    var x2 = +line.getAttribute('x2'), y2 = +line.getAttribute('y2');
    line.dataset.tx = x2; line.dataset.ty = y2;
    line.classList.remove('is-hidden');
    if (reduceMotion) return;
    var start = performance.now();
    (function frame(now) {
      var t = Math.min((now - start) / CONNECTOR_GROW, 1);
      var e = 1 - Math.pow(1 - t, 5);
      line.setAttribute('x2', x1 + (x2 - x1) * e);
      line.setAttribute('y2', y1 + (y2 - y1) * e);
      if (t < 1) line._raf = requestAnimationFrame(frame);
    })(start);
  }
  function hideLine(line) {
    cancelAnimationFrame(line._raf);
    if (line.dataset.tx) {
      line.setAttribute('x2', line.dataset.tx);
      line.setAttribute('y2', line.dataset.ty);
      delete line.dataset.tx; delete line.dataset.ty;
    }
    line.classList.add('is-hidden');
  }

  function hintFor(win) { return win.parentElement.querySelector('[data-hint]'); }
  function setHint(win, text) { var h = hintFor(win); if (h) h.firstChild.textContent = text; }

  function dockController(win) {
    var idle = win.querySelector('[data-dock-idle]');
    var busy = win.querySelector('[data-dock-busy]');
    var card = win.querySelector('[data-dock-card]');
    return function (state) {
      if (!idle) return;
      idle.hidden = state !== 'idle';
      busy.hidden = state !== 'busy';
      card.hidden = state !== 'card';
    };
  }

  var windows = {
    conversation: function (win) {
      var DEFS = {
        justice: ['Justice', 'The virtue of steadily giving each person what they are due. It orders a person toward others rather than toward themselves.'],
        aquinas: ['Thomas Aquinas', 'A thirteenth-century Dominican friar and theologian whose Summa Theologica joins Aristotle’s philosophy to Christian doctrine.'],
        virtue: ['Virtue', 'A settled disposition to act well, formed by practice, that makes both the action and the person who does it good.'],
        habit: ['Habit', 'A settled disposition, formed by repeated acts, that inclines a person to act in a certain way readily and with ease.'],
        prudence: ['Prudence', 'Practical wisdom: the virtue of judging rightly what should be done in a particular situation, which guides the exercise of the other moral virtues.'],
        distributive: ['Distributive justice', 'The part of justice that governs how a community shares its common goods among its members, in proportion to what each is due.']
      };
      var card = win.querySelector('[data-card]');
      var title = win.querySelector('[data-card-title]');
      var body = win.querySelector('[data-card-body]');
      var save = win.querySelector('[data-card-save]');
      var dock = dockController(win);
      var saved = {}, current = null, timer = null;

      // As on the home page: the tapped term shimmers while its definition is generated, then
      // the docked card animates in at the foot of the window. Choosing another term replays it.
      function open(key) {
        clearTimeout(timer);
        current = key;
        var term = null;
        win.querySelectorAll('[data-term]').forEach(function (t) {
          t.classList.toggle('is-active', t.dataset.term === key);
          t.classList.remove('is-generating');
          if (t.dataset.term === key) term = t;
        });
        // Put the card away without a transition, so the next one animates in from scratch.
        card.classList.add('is-reset', 'is-closed');
        void card.offsetWidth;
        card.classList.remove('is-reset');
        void term.offsetWidth;
        term.classList.add('is-generating');
        save.setAttribute('aria-pressed', String(!!saved[key]));
        dock('busy');
        setHint(win, 'Defining \u201C' + DEFS[key][0] + '\u201D\u2026');
        timer = setTimeout(function () {
          term.classList.remove('is-generating');
          title.textContent = DEFS[key][0];
          body.textContent = DEFS[key][1];
          card.classList.remove('is-closed');
          dock('card');
          setHint(win, 'Tap the bookmark to save it as an Insight.');
        }, wait(2000));
      }
      function close() {
        clearTimeout(timer);
        current = null;
        card.classList.add('is-closed');
        win.querySelectorAll('[data-term]').forEach(function (t) { t.classList.remove('is-active', 'is-generating'); });
        dock('idle');
      }
      win.querySelectorAll('[data-term]').forEach(function (t) {
        t.addEventListener('click', function (e) {
          e.stopPropagation();
          if (current === t.dataset.term) close(); else open(t.dataset.term);
        });
      });
      save.addEventListener('click', function (e) {
        e.stopPropagation();
        saved[current] = !saved[current];
        save.setAttribute('aria-pressed', String(saved[current]));
        setHint(win, saved[current] ? 'Saved. It now lives in your Insight Tree.' : 'Tap the bookmark to save it as an Insight.');
      });
      card.addEventListener('click', function (e) { e.stopPropagation(); });
      win.addEventListener('click', close);
    },

    branches: function (win) {
      var track = win.querySelector('[data-track]');
      win.querySelector('[data-branch-open]').addEventListener('click', function () {
        track.classList.add('is-branch');
        setHint(win, 'The main line is still there, exactly as you left it.');
      });
      win.querySelector('[data-branch-back]').addEventListener('click', function () {
        track.classList.remove('is-branch');
        setHint(win, 'Open a branch, then go back to the main line.');
      });
    },

    'library-insights': function (win) {
      var DATA = {
        distributive: ['Distributive justice', [
          ['Aquinas on Justice', 'How a community shares its common goods among its members, in proportion to what each is due.'],
          ['Aristotle’s Politics', 'Giving shares of honor or goods according to merit, as opposed to strict arithmetic equality.']
        ]],
        virtue: ['Virtue', [['Aquinas on Justice', 'A settled disposition to act well, formed by practice, that makes both the action and the person good.']]],
        telos: ['Telos', [['Greek Philosophy', 'The end or purpose built into a thing’s nature; what it is for.']]]
      };
      var card = win.querySelector('[data-card]');
      var title = win.querySelector('[data-card-title]');
      var body = win.querySelector('[data-card-body]');
      var items = win.querySelectorAll('[data-insight]');
      function show(key) {
        items.forEach(function (i) { i.classList.toggle('is-active', i.dataset.insight === key); });
        title.textContent = DATA[key][0];
        body.innerHTML = '';
        DATA[key][1].forEach(function (c) {
          var d = document.createElement('div');
          var ctx = document.createElement('p'); ctx.className = 'w-card__context'; ctx.textContent = 'In: ' + c[0];
          var p = document.createElement('p'); p.className = 'w-card__body'; p.style.minHeight = '0'; p.textContent = c[1];
          d.appendChild(ctx); d.appendChild(p); body.appendChild(d);
        });
        card.classList.remove('is-closed');
      }
      items.forEach(function (i) { i.addEventListener('click', function () { show(i.dataset.insight); }); });
      show('distributive');
    },

    home: function (win) {
      var CARDS = [
        ['Question of the Day', 'If justice gives each their due, what is owed to someone who has wronged you?', 'Drawn from something you left unresolved in Aquinas on Justice.', 'Answer'],
        ['Today in History', 'Penicillin Discovered', 'Alexander Fleming is traditionally credited with noticing, around this date in 1928, that a mold contaminating one of his cultures was killing surrounding bacteria.', '↪ Tell me more…'],
        ['Loose Thread', 'Natural Law', 'This Node Concept hasn’t connected to anything else in its conversation yet.', 'Open in the tree'],
        ['Terms You Glossed Over', 'Synderesis', 'You looked this up a few days ago and never saved it.', 'View definition'],
        ['Your Quote', '“Mercy isn’t the opposite of justice. It’s what justice looks like once it has been satisfied.”', 'Something you wrote that was an original thought of your own.', 'Continue the thread']
      ];
      var cardEl = win.querySelector('[data-home-card]');
      var eyebrow = win.querySelector('[data-home-eyebrow]');
      var title = win.querySelector('[data-home-title]');
      var body = win.querySelector('[data-home-body]');
      var action = win.querySelector('[data-home-action]');
      var pager = win.querySelector('[data-home-pager]');
      var index = 0, timer = null;
      CARDS.forEach(function (c, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', c[0]);
        b.addEventListener('click', function () { go(i, true); });
        pager.appendChild(b);
      });
      function render() {
        var c = CARDS[index];
        eyebrow.textContent = c[0];
        title.textContent = c[1];
        title.classList.toggle('w-home__title--quote', c[1].charAt(0) === '“' || index === 0);
        body.textContent = c[2];
        action.textContent = c[3];
        pager.querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('is-on', i === index); });
      }
      function go(i, user) {
        if (user) clearInterval(timer);
        cardEl.classList.add('is-out');
        setTimeout(function () {
          index = i;
          render();
          cardEl.classList.remove('is-out');
        }, wait(250));
      }
      render();
      if (!reduceMotion) timer = setInterval(function () { go((index + 1) % CARDS.length); }, 4500);
    },

    tasks: function (win) {
      var list = win.querySelector('[data-task-list]');
      var status = win.querySelector('[data-task-status]');
      var NAMES = ['User Question', 'Define “distributive justice”', 'Update Insight Tree', 'Consolidate information'];
      var tasks, timer;
      function reset() { tasks = NAMES.map(function (n, i) { return { name: n, state: i === 0 ? 'active' : 'waiting' }; }); render(); schedule(); }
      function render() {
        list.innerHTML = '';
        tasks.forEach(function (t, i) {
          var row = document.createElement('div');
          row.className = 'w-task' + (t.state === 'done' ? ' is-done' : t.state === 'active' ? ' is-active' : '');
          var st = document.createElement('span'); st.className = 'w-task__state';
          var name = document.createElement('span'); name.textContent = t.name;
          row.appendChild(st); row.appendChild(name);
          if (t.state === 'waiting') {
            var x = document.createElement('button');
            x.type = 'button'; x.className = 'w-task__remove'; x.textContent = '×';
            x.setAttribute('aria-label', 'Remove ' + t.name);
            x.addEventListener('click', function () { tasks.splice(i, 1); render(); });
            row.appendChild(x);
          }
          list.appendChild(row);
        });
        var active = tasks.findIndex(function (t) { return t.state === 'active'; });
        var remaining = tasks.filter(function (t) { return t.state !== 'done'; }).length;
        status.textContent = active < 0 ? 'Idle' : (active + 1) + '/' + tasks.length + ' Thinking';
        status.classList.toggle('w-thinking', active >= 0);
        if (!remaining) status.style.webkitTextFillColor = 'var(--heading)'; else status.style.webkitTextFillColor = '';
      }
      function schedule() {
        clearTimeout(timer);
        timer = setTimeout(function step() {
          var a = tasks.findIndex(function (t) { return t.state === 'active'; });
          if (a >= 0) tasks[a].state = 'done';
          var next = tasks.findIndex(function (t) { return t.state === 'waiting'; });
          if (next >= 0) { tasks[next].state = 'active'; render(); timer = setTimeout(step, 1800); }
          else { render(); timer = setTimeout(reset, 2600); }
        }, 1800);
      }
      if (reduceMotion) { tasks = NAMES.map(function (n, i) { return { name: n, state: i === 0 ? 'done' : i === 1 ? 'active' : 'waiting' }; }); render(); }
      else reset();
    },

    library: function (win) {
      var WORKS = [
        ['World English Bible', 'Scripture'], ['The Ecumenical Creeds', 'Creeds'], ['The Didache', 'Early Church'],
        ['Summa Theologica', 'Theology · Aquinas'], ['City of God', 'Theology · Augustine'], ['Confessions', 'Theology · Augustine'],
        ['Against Heresies', 'Church Fathers · Irenaeus'], ['On the Incarnation', 'Church Fathers · Athanasius'], ['First Apology', 'Church Fathers · Justin Martyr'],
        ['Proslogion', 'Theology · Anselm'], ['Ecclesiastical History', 'Church history · Eusebius'], ['Ecclesiastical History of the English People', 'Church history · Bede'],
        ['The Seven Ecumenical Councils', 'Councils'], ['Canons and Decrees of the Council of Trent', 'Councils'], ['Catechism of the Council of Trent', 'Catechisms'],
        ['Baltimore Catechism No. 3', 'Catechisms'], ['Heidelberg Catechism', 'Catechisms · Reformed'], ['Augsburg Confession', 'Confessions · Lutheran'],
        ['Belgic Confession', 'Confessions · Reformed'], ['Westminster Confession of Faith', 'Confessions · Reformed'], ['Thirty-Nine Articles', 'Confessions · Anglican'],
        ['Nicomachean Ethics', 'Philosophy · Aristotle'], ['Metaphysics', 'Philosophy · Aristotle'], ['Categories', 'Philosophy · Aristotle'],
        ['The Consolation of Philosophy', 'Philosophy · Boethius'], ['The Prince', 'Political philosophy · Machiavelli'], ['The Wealth of Nations', 'Economics · Adam Smith'],
        ['History of Rome', 'History · Livy'], ['Antiquities of the Jews and The Jewish War', 'History · Josephus'], ['Parallel Lives', 'History · Plutarch'],
        ['The Histories', 'History · Herodotus'], ['History of the Peloponnesian War', 'History · Thucydides'], ['Annals and Histories', 'History · Tacitus'],
        ['The Decline and Fall of the Roman Empire', 'History · Gibbon'], ['Magna Carta', 'Founding documents'], ['Declaration of Independence', 'Founding documents'],
        ['Constitution of the United States', 'Founding documents']
      ];
      var input = win.querySelector('[data-lib-search]');
      var featured = win.querySelector('[data-lib-featured]');
      var results = win.querySelector('[data-lib-results]');
      input.addEventListener('input', function () {
        var q = input.value.trim().toLowerCase();
        featured.hidden = !!q;
        results.hidden = !q;
        if (!q) return;
        var hits = WORKS.filter(function (w) { return (w[0] + ' ' + w[1]).toLowerCase().indexOf(q) >= 0; });
        results.innerHTML = '';
        if (!hits.length) {
          var e = document.createElement('p'); e.className = 'w-empty'; e.textContent = 'No works match “' + input.value.trim() + '”.';
          results.appendChild(e);
          return;
        }
        hits.forEach(function (w) {
          var row = document.createElement('div'); row.className = 'w-result';
          var t = document.createElement('span'); t.textContent = w[0];
          var s = document.createElement('small'); s.textContent = w[1];
          row.appendChild(t); row.appendChild(s); results.appendChild(row);
        });
      });
    },

    global: function (win) {
      var prompt = win.querySelector('[data-global-prompt]');
      var chips = win.querySelectorAll('[data-new]');
      var lines = win.querySelectorAll('[data-new-line]');
      var update = win.querySelector('[data-global-update]');
      var later = win.querySelector('[data-global-later]');
      var TARGETS = [[24, 58], [76, 56]];
      var placed = false;
      update.addEventListener('click', function () {
        if (placed) {
          placed = false;
          chips.forEach(function (c) { c.classList.add('is-hidden'); c.style.left = '50%'; c.style.top = '92%'; });
          lines.forEach(hideLine);
          prompt.classList.remove('is-closed');
          update.textContent = 'Update Tree';
          later.hidden = false;
          setHint(win, 'Your global tree only changes when you say so.');
          return;
        }
        placed = true;
        prompt.classList.add('is-closed');
        later.hidden = true;
        chips.forEach(function (c, i) {
          setTimeout(function () {
            c.classList.remove('is-hidden');
            c.style.left = TARGETS[i][0] + '%';
            c.style.top = TARGETS[i][1] + '%';
            // The connector grows once the chip has landed.
            setTimeout(function () { growLine(lines[i]); }, wait(450));
          }, wait(150 + i * 150));
        });
        update.textContent = 'Reset';
        setHint(win, 'Placed near the Node Concept they relate to.');
      });
      later.addEventListener('click', function () {
        prompt.classList.add('is-closed');
        later.hidden = true;
        update.textContent = 'Update Tree';
        setHint(win, 'The update waits until you’re ready.');
        setTimeout(function () { if (!placed) { prompt.classList.remove('is-closed'); later.hidden = false; } }, 2500);
      });
    },

    'make-node': function (win) {
      var telos = win.querySelector('[data-telos]');
      var telosNode = win.querySelector('[data-telos-node]');
      var children = win.querySelectorAll('[data-child]');
      var lines = win.querySelectorAll('[data-child-line]');
      var make = win.querySelector('[data-make]');
      var reset = win.parentElement.querySelector('[data-reset]');
      var done = false;
      make.addEventListener('click', function () {
        if (done) return;
        done = true;
        make.textContent = 'Thinking';
        make.classList.add('w-thinking');
        make.style.background = 'transparent';
        telos.style.opacity = '0';
        telosNode.style.opacity = '1';
        // Children first appear as flashing loading bubbles at the node, then splay out.
        children.forEach(function (c) { c.classList.remove('is-hidden'); c.classList.add('w-flash'); c.querySelector('span').style.display = 'none'; });
        children.forEach(function (c, i) {
          setTimeout(function () {
            c.style.left = c.dataset.x + '%';
            c.style.top = c.dataset.y + '%';
          }, wait(500 + i * 150));
          setTimeout(function () { growLine(lines[i]); }, wait(950 + i * 150));
          setTimeout(function () {
            c.classList.remove('w-flash');
            c.querySelector('span').style.display = '';
          }, wait(1500 + i * 150));
        });
        setTimeout(function () {
          make.textContent = 'Make Node';
          make.classList.remove('w-thinking');
          make.style.background = '';
          if (reset) reset.hidden = false;
        }, wait(2000));
      });
      if (reset) reset.addEventListener('click', function () {
        done = false;
        telos.style.opacity = '';
        telosNode.style.opacity = '0';
        children.forEach(function (c) { c.classList.add('is-hidden'); c.style.left = '50%'; c.style.top = '40%'; });
        lines.forEach(hideLine);
        reset.hidden = true;
      });
    },

    grounded: function (win) {
      var cite = win.querySelector('[data-cite]');
      var card = win.querySelector('[data-card]');
      var dock = dockController(win);
      cite.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = card.classList.toggle('is-closed') === false;
        cite.classList.toggle('is-active', open);
        dock(open ? 'card' : 'idle');
        setHint(win, open ? 'The passage, from the Library on your phone.' : 'Tap the citation to open the passage it came from.');
      });
      card.addEventListener('click', function (e) { e.stopPropagation(); });
      win.addEventListener('click', function () { card.classList.add('is-closed'); cite.classList.remove('is-active'); dock('idle'); });
    }
  };

  document.querySelectorAll('[data-window]').forEach(function (win) {
    var init = windows[win.dataset.window];
    if (init) init(win);
  });
})();
