// Insight Tree preview for the home page's "A Map of Your Own Thinking" section.
//
// A small port of the iOS app's Insight Tree canvas and Study mode (Aquinas-iOS-main):
//   - OrbitCamera.swift           perspective camera orbiting a target (project / turn)
//   - InsightTreeCamera.swift     overhead tree camera (focal length 3990)
//   - InsightClusterSpatialLayout Insights at ±45° elevation, alternating around the node
//   - StudyNodeLayout.swift       Thomson sphere spread for Study
//   - StudyNodeScene.swift        Study framing, dashed floor ring, receding dot floor
//   - AnimatedDotGridBackground   drifting dot-grid brightness (blobOpacity)
//   - InsightTreeCanvasView       runEntranceSequence: pan to each new Insight, spring it in,
//                                 ripple the dot grid, then grow its connector out of the node
// Steps: 1 = streamed answer text, 2 = Node Concept and its Insights grow, 3 = Study (3D).
// Each [data-insight-tree] window runs independently. Without data-mode, the page's .tree-step
// blocks drive it on scroll (home page). data-mode="grow" plays step 2 whenever the window scrolls
// into view; data-mode="study" grows the tree and then swings into Study; data-mode="stream"
// plays the streamed answer (step 1).
//
// data-mode="midpoint" (Features page) grows a tree, selects two Insights, and enters the app's
// Midpoint mode (InsightTreeCanvasView.midpointOverlay): the rest of the tree fades out, a line
// joins the selection, and MidpointHandle springs in to be dragged along it. Placing runs the
// app's sequence: a hollow loading bubble flashes for 3.5 s, then a strong ripple and the title.
// [data-midpoint-panel] wraps the card and the app's docked UI: the MidpointPercentCard and the
// placed Insight's card sit inside the canvas at its foot, so the tree is framed in the space
// above them, and the dock's Center / Place actions sit just under the canvas.
(function () {
  document.querySelectorAll('[data-insight-tree]').forEach(initTree);

  function initTree(root) {
  var mode = root.dataset.mode || '';
  var isMid = mode === 'midpoint';
  // data-mode="add": the tree is already there, and one more Insight joins it.
  var isAdd = mode === 'add';
  // The Guide's Midpoint example (data-mid-guide): the app's UserGuideMidpointExample, with its
  // Virtue tree, Select / Midpoint / Reset buttons, and an Example Result under the canvas.
  var guide = isMid && !!root.closest('[data-mid-guide]');
  var GUIDE_DEFS = {
    Justice: 'The constant will to give each person what is owed.',
    Mercy: 'Compassion for another\u2019s distress that moves us to relieve it, giving more than is owed.',
    Prudence: 'Practical wisdom that judges what the good requires here and now.',
    Courage: 'Firmness of mind in facing danger or hardship for the sake of the good.'
  };
  var scrollStudy = root.hasAttribute('data-scroll-study');
  var studyProgress = null;
  // Inside the Features journey a card plays when its scene is shown, not when it scrolls into view.
  var journeyScene = root.closest('[data-scene]');

  var canvas = root.querySelector('canvas');
  var layer = root.querySelector('.tree-card__layer');
  var ctx = canvas.getContext('2d');
  var steps = mode ? [] : Array.from(document.querySelectorAll('.tree-step'));
  var stage = root.parentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BROWN = scrollStudy ? '255, 250, 240' : '74, 50, 28';
  var BOND = 190;                        // InsightTreeCanvasView.bondLength default
  var FOCAL = 3990;                      // InsightTreeCamera.focalLength
  var MAX_ELEVATION = Math.PI / 4;       // InsightClusterSpatialLayout guardrail
  var STUDY_PITCH = Math.PI / 2;         // StudyFraming.studyPitch
  var RING_VIEW_ANGLE = Math.asin(39 / 297);
  var RING_RATIO = 1.35;
  var DASHES = 60, DASH_FILL = 0.5;
  var RIPPLE_BASE = 2.4;                 // App ripple lasts 2.4 * (0.5 + 0.9 * strength)
  var CONNECTOR_GROW = 0.55;             // InsightConnectorLine.growAnimation (ease-out quint)

  // ---------- Math ----------

  function turn(v, yaw) {
    var s = Math.sin(yaw), c = Math.cos(yaw);
    return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c, v[2]];
  }

  // OrbitCamera.project, with the rotation center at the target.
  function project(cam, p) {
    var t = turn([p[0] - cam.target[0], p[1] - cam.target[1], p[2] - cam.target[2]], cam.yaw);
    var ps = Math.sin(cam.pitch), pc = Math.cos(cam.pitch);
    var vx = t[0], vy = t[1] * pc + t[2] * ps, vz = -t[1] * ps + t[2] * pc;
    var depth = cam.distance - vz;
    if (depth <= 1e-6) return null;
    var scale = cam.distance / depth;
    return { x: cam.ppx + vx * scale * cam.zoom, y: cam.ppy - vy * scale * cam.zoom, scale: scale, depth: depth };
  }

  function len(v) { return Math.hypot(v[0], v[1], v[2]); }
  function norm(v) { var l = len(v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
  function smoothstep(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // StudyNodeLayout.sphereSpread
  function sphereSpread(starts, iterations) {
    iterations = iterations || 600;
    var pts = starts.map(function (s, i) {
      var g = i * 2.399963;
      var n = norm(s);
      return norm([n[0] + Math.cos(g) * 0.08, n[1] + Math.sin(g) * 0.08, n[2] + Math.cos(g * 1.7) * 0.08]);
    });
    if (pts.length < 2) return pts;
    for (var it = 0; it < iterations; it++) {
      var step = 0.1 * (1 - it / iterations) + 0.002;
      var forces = pts.map(function () { return [0, 0, 0]; });
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var o = [pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]];
          var d2 = dot(o, o);
          if (d2 < 1e-8) { o = norm(cross(pts[i], [0.3, 0.5, 0.8])); d2 = 1e-4; }
          var k = 1 / (d2 * Math.sqrt(d2));
          for (var a = 0; a < 3; a++) { forces[i][a] += o[a] * k; forces[j][a] -= o[a] * k; }
        }
      }
      for (var m = 0; m < pts.length; m++) {
        var f = forces[m], p = pts[m], fd = dot(f, p);
        var tan = [f[0] - fd * p[0], f[1] - fd * p[1], f[2] - fd * p[2]];
        var tl = len(tan);
        if (tl < 1e-12) continue;
        var mv = Math.min(tl, 1) * step / tl;
        pts[m] = norm([p[0] + tan[0] * mv, p[1] + tan[1] * mv, p[2] + tan[2] * mv]);
      }
    }
    return pts;
  }

  // StudyNodeLayout.slerp
  function slerp(a, b, t) {
    var c = clamp(dot(a, b), -1, 1), ang = Math.acos(c);
    if (ang < 1e-6) return norm([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]);
    var s = Math.sin(ang), wa = Math.sin((1 - t) * ang) / s, wb = Math.sin(t * ang) / s;
    return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
  }

  // AnimatedDotGridBackground.blobOpacity
  function blobOpacity(wx, wy, time) {
    var x = wx * 0.022, y = wy * 0.022;
    var w1 = Math.sin(x * 1.1 + time * 0.22) * Math.cos(y * 0.95 + time * 0.17);
    var w2 = Math.sin(x * 0.65 - y * 0.75 + time * 0.31) * 0.55;
    var w3 = Math.cos(x * 1.4 + y * 1.05 - time * 0.19) * 0.38;
    var n = ((w1 + w2 + w3) / 1.93 + 1) / 2;
    return 0.01 + Math.pow(n, 4) * 0.28;
  }

  // ---------- Springs (Motion.springRelaxed: response 0.5, damping 0.8) ----------

  function Spring(value, response, damping) {
    this.v = value; this.target = value; this.vel = 0; this.pending = null;
    this.k = Math.pow(2 * Math.PI / (response || 0.5), 2);
    this.c = 2 * (damping || 0.8) * Math.sqrt(this.k);
  }
  Spring.prototype.to = function (target, delay, now) {
    if (delay > 0) { this.pending = { target: target, at: now + delay * 1000 }; return; }
    this.pending = null; this.target = target;
  };
  Spring.prototype.step = function (dt, now) {
    if (this.pending && now >= this.pending.at) { this.target = this.pending.target; this.pending = null; }
    if (reduceMotion) { this.v = this.target; this.vel = 0; return; }
    var sub = Math.ceil(dt / (1 / 240));
    var h = dt / sub;
    for (var i = 0; i < sub; i++) {
      var a = -this.k * (this.v - this.target) - this.c * this.vel;
      this.vel += a * h; this.v += this.vel * h;
    }
  };

  // ---------- Content ----------

  function el(cls, icon, text) {
    var d = document.createElement('div');
    d.className = cls;
    var img = document.createElement('img');
    img.src = icon; img.alt = '';
    var span = document.createElement('span');
    span.textContent = text;
    d.appendChild(img); d.appendChild(span);
    layer.appendChild(d);
    return d;
  }

  var node = {
    el: el('it-node', scrollStudy ? 'assets/home/icon-node-dark.svg' : 'assets/home/icon-node.svg', guide ? 'Virtue' : isMid ? 'Moral Theology' : 'Greek Philosophy'),
    vis: new Spring(0)
  };

  // Evenly spaced from π/8 (baseChipAngle), with the odd one out level and its neighbours at
  // the top and bottom of the ±45° band. Like the app, each Insight appears in its final place.
  // The Midpoint tree stays flat, so the selection line meets its chips exactly.
  var insights = (guide ? ['Justice', 'Mercy', 'Prudence', 'Courage'].map(function (title, i) {
    return { title: title, angle: Math.PI / 8 + i * Math.PI / 2, elev: 0 };
  }) : isMid ? [
    { title: 'Natural Law', angle: Math.PI / 8 + 2 * Math.PI / 3, elev: 0 },
    { title: 'Conscience', angle: Math.PI / 8, elev: 0 },
    { title: 'Prudence', angle: Math.PI / 8 + 4 * Math.PI / 3, elev: 0 }
  ] : isAdd ? [
    { title: 'Cynicism', angle: Math.PI / 8 + 2 * Math.PI / 3, elev: MAX_ELEVATION },
    { title: 'Epicureanism', angle: Math.PI / 8 + 4 * Math.PI / 3, elev: -MAX_ELEVATION },
    { title: 'Eudaimonia', angle: Math.PI / 8, elev: 0 }
  ] : [
    { title: 'Eudaimonia', angle: Math.PI / 8, elev: 0 },
    { title: 'Cynicism', angle: Math.PI / 8 + 2 * Math.PI / 3, elev: MAX_ELEVATION },
    { title: 'Epicureanism', angle: Math.PI / 8 + 4 * Math.PI / 3, elev: -MAX_ELEVATION }
  ]).map(makeInsight);
  function makeInsight(d, i) {
    return {
      title: d.title,
      bond: BOND,
      order: i,
      finalAngle: d.angle,
      finalElev: d.elev,
      ang: new Spring(d.angle, 0.7, 0.9),
      elv: new Spring(d.elev, 0.7, 0.9),
      el: el('it-chip', scrollStudy ? 'assets/home/icon-insight-dark.svg' : 'assets/home/icon-insight.svg', d.title),
      vis: new Spring(0),
      lineStart: null
    };
  }

  function treeDirection(angle, elev) {
    return norm([Math.cos(angle), Math.sin(angle), Math.tan(elev)]);
  }
  var studyDirs = sphereSpread(insights.map(function (i) { return treeDirection(i.finalAngle, i.finalElev); }));

  // The home journey adds whichever term was chosen in the answer. Natural philosophy
  // sits farther from Greek Philosophy, with its longer connector retained in Study.
  // Choosing a different term later adds a further Insight to the same tree.
  // Four Insights sit a quarter turn apart, rather than a third; the existing ones glide there.
  // Slots run chosen Insight, Cynicism, Epicureanism, then the newcomer; heights alternate 0, up, 0, down.
  function spreadEvenly() {
    var slots = [insights[2], insights[0], insights[1], insights[3]];
    var elevs = [0, MAX_ELEVATION, 0, -MAX_ELEVATION];
    slots.forEach(function (ins, k) {
      ins.finalAngle = Math.PI / 8 + k * Math.PI / 2;
      ins.finalElev = elevs[k];
      ins.ang.to(ins.finalAngle, 0, performance.now());
      ins.elv.to(ins.finalElev, 0, performance.now());
    });
  }
  var TERMS = { eudaimonia: ['Eudaimonia', 1], 'natural-philosophy': ['Natural philosophy', 1.45] };
  var addedKeys = ['eudaimonia'];     // the default Insight, until a term is chosen before the tree is first seen
  var claimed = false;
  var unrevealed = [];                // Insights added after the tree played, waiting to be on screen
  if (isAdd && scrollStudy) {
    root.addEventListener('journey:insight', function (event) {
      var key = event.detail.key, term = TERMS[key];
      var newest = insights[insights.length - 1];
      if (!claimed && state.step < 2) {
        claimed = true;
        addedKeys = [key];
        newest.title = term[0];
        newest.bond = BOND * term[1];
        newest.el.querySelector('span').textContent = term[0];
      } else {
        claimed = true;
        if (addedKeys.indexOf(key) >= 0) return;
        addedKeys.push(key);
        var ins = makeInsight({ title: term[0], angle: Math.PI / 8 + 3 * Math.PI / 2, elev: 0 }, insights.length);
        ins.bond = BOND * term[1];
        insights.push(ins);
        spreadEvenly();
        studyDirs = sphereSpread(insights.map(function (i) { return treeDirection(i.finalAngle, i.finalElev); }));
        if (state.step >= 2) unrevealed.push(ins);
      }
      var titles = addedKeys.map(function (k) { return TERMS[k][0]; }).join(' and ');
      root.setAttribute('aria-label', 'An Insight Tree around the Node Concept Greek Philosophy, with the Insight ' + titles + ' being added, turning into 3D Study as you scroll. Drag to rotate in Study');
    });
    // The tree frame is on screen: Insights added while it was away appear now, in place.
    root.addEventListener('journey:visible', function () {
      var list = unrevealed;
      unrevealed = [];
      list.forEach(function (ins) {
        later(reduceMotion ? 0 : 250, function () { reveal(ins); ripple(treePoint(ins)); });
      });
    });
  }

  // ---------- Step state ----------

  var state = {
    step: -1,
    p: 0, pFrom: 0, pTo: 0, pStart: 0,
    yaw: 0, spinVel: 0, ringHalfWidth: 150,
    // Tree camera pan, in world units (focusInsight's spring: response 0.58, damping 0.64).
    panX: new Spring(0, 0.58, 0.64), panY: new Spring(0, 0.58, 0.64),
    ripples: [],
    dragging: false, lastX: 0, lastT: 0,
    userSpun: false,
    // Pointer over the canvas: nearby dots brighten, and a press sends out the app's ripple.
    hover: { x: 0, y: 0, on: false, amount: 0 }, cam: null
  };

  // Step 1: the answer text streams in. Step 2: the Node Concept appears, then each Insight
  // enters the way runEntranceSequence reveals new ones: the camera pans to it (0.95 s), it
  // springs up out of a blur with a ripple, its connector grows once the spring lands, and the
  // next follows 0.7 s later. The Study window reveals all three at once, the app's path for
  // larger batches. Step 3: Study.
  var NODE_DELAY = 0.1;
  var ENTRANCE_START = 450;    // 0.25 s stagger + 0.2 s pause before the first zoom
  var FOCUS_SETTLE = 950;      // camera spring settle before the reveal
  var REVEAL_SETTLE = 450;     // springRelaxed logically complete, then the connector grows
  var NEXT_INSIGHT = 700;      // entrance + brief pause before the next Insight
  var timers = [];

  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function treePoint(ins) {
    return [Math.cos(ins.ang.v) * ins.bond, Math.sin(ins.ang.v) * ins.bond, 0];
  }
  function panTo(x, y) { var now = performance.now(); state.panX.to(x, 0, now); state.panY.to(y, 0, now); }
  function ripple(world, strength, radiusScale) {
    strength = strength || 1;
    state.ripples.push({
      world: world, start: performance.now() / 1000, strength: strength, radiusScale: radiusScale || 1,
      duration: RIPPLE_BASE * (0.5 + 0.9 * strength)
    });
  }
  function reveal(ins) {
    ins.vis.to(1, 0, performance.now());
    later(REVEAL_SETTLE, function () { ins.lineStart = performance.now(); });
  }

  // Returns how long the grow takes, in ms.
  function grow(nodeDelayMs) {
    if (reduceMotion) {
      insights.forEach(function (ins) { ins.vis.to(1, 0, performance.now()); ins.lineStart = -Infinity; });
      return 0;
    }
    var t = nodeDelayMs + ENTRANCE_START;
    if (isAdd) {
      // The Node Concept and its earlier Insights are already in place; only the last one is new.
      node.vis.v = node.vis.target = 1; node.vis.pending = null;
      insights.slice(0, 2).forEach(function (ins) { ins.vis.v = ins.vis.target = 1; ins.lineStart = -Infinity; });
      // No camera pan: the chosen Insights appear in place with their usual entrance and ripple.
      unrevealed = [];
      insights.slice(2).forEach(function (ins) {
        later(t, function () { reveal(ins); ripple(treePoint(ins)); });
      });
      return t + REVEAL_SETTLE + CONNECTOR_GROW * 1000;
    }
    if (mode === 'study' || isMid) {
      later(t, function () {
        insights.forEach(reveal);
        ripple([0, 0, 0]);
      });
      return t + REVEAL_SETTLE + CONNECTOR_GROW * 1000;
    }
    insights.forEach(function (ins) {
      var pt = treePoint(ins);
      later(t, function () { panTo(pt[0], pt[1]); });
      later(t + FOCUS_SETTLE, function () { reveal(ins); ripple(pt); });
      t += FOCUS_SETTLE + NEXT_INSIGHT;
    });
    // Settle back over the whole tree so the card ends on the full picture.
    later(t, function () { panTo(0, 0); });
    return t + FOCUS_SETTLE;
  }

  function setStep(n) {
    if (n === state.step) return;
    var prev = state.step;
    state.step = n;
    var now = performance.now();

    root.classList.toggle('is-streaming', n === 1);
    if (n === 1) playStream(); else stopStream();

    var treeOn = n >= 2;
    var growing = treeOn && prev < 2;
    // Coming from the streamed text, wait for it to fade before the node rises.
    var nodeDelay = prev === 1 ? 0.35 : NODE_DELAY;
    node.vis.to(treeOn ? 1 : 0, growing ? nodeDelay : 0, now);

    if (growing || !treeOn) {
      clearTimers();
      panTo(0, 0);
      state.ripples = [];
      insights.forEach(function (ins) { ins.vis.to(0, 0, now); ins.lineStart = null; });
    }
    state.growMs = growing ? grow(nodeDelay * 1000) : 0;
    // Leaving the grow early (into Study) finishes it at once over the whole tree.
    if (n >= 3 && prev === 2) {
      clearTimers();
      panTo(0, 0);
      insights.forEach(function (ins) {
        ins.vis.to(1, 0, now);
        if (ins.lineStart === null) ins.lineStart = now;
      });
    }

    var toStudy = n >= 3 ? 1 : 0;
    if (toStudy !== state.pTo) {
      if (!toStudy) {
        // Drop whole turns so the exit unwinds at most half a turn.
        state.yaw = Math.atan2(Math.sin(state.yaw), Math.cos(state.yaw));
        state.spinVel = 0;
      }
      state.pFrom = state.p; state.pTo = toStudy; state.pStart = now;
      if (toStudy && !state.userSpun && !reduceMotion) state.introSpin = true;
    }

    steps.forEach(function (s) { s.classList.toggle('is-active', Number(s.dataset.step) === n); });
    root.classList.toggle('is-study', n >= 3);
  }

  // The homepage keeps one canvas and drives its camera and spatial layout from scroll.
  root.addEventListener('journey:study-progress', function (event) {
    if (!scrollStudy) return;
    studyProgress = clamp(event.detail.progress, 0, 1);
    if (studyProgress > 0) {
      if (state.step < 2) setStep(2);
      // Fast scrolling can reach Study before the entrance finishes.
      clearTimers();
      panTo(0, 0);
      node.vis.to(1, 0, performance.now());
      insights.forEach(function (ins) {
        ins.vis.to(1, 0, performance.now());
        if (ins.lineStart === null) ins.lineStart = performance.now();
      });
    }
    if (state.step >= 2) state.step = studyProgress > 0.95 ? 3 : 2;
    root.classList.toggle('is-study', studyProgress > 0.95);
    root.dataset.studyProgress = studyProgress.toFixed(3);
    if (studyProgress < 0.95) {
      state.spinVel = 0;
      state.dragging = false;
      root.classList.remove('is-dragging');
    }
  });

  function readStep() {
    var vh = window.innerHeight;
    var stacked = window.matchMedia('(max-width: 1024px)').matches;
    // Stacked (phone/tablet): the card is pinned on top, so read against the space below it.
    var below = Math.max(stage.getBoundingClientRect().bottom, 0);
    var line = stacked ? below + (vh - below) * 0.45 : vh * 0.55;
    var n = 0;
    steps.forEach(function (s) {
      if (s.getBoundingClientRect().top < line) n = Number(s.dataset.step);
    });
    setStep(n);
  }

  // ---------- Streamed answer text (step 1) ----------

  var streamText = root.querySelector('[data-stream]');
  var words = [];
  (function wrap(el) {
    Array.from(el.childNodes).forEach(function (child) {
      if (child.nodeType === Node.TEXT_NODE) {
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var span = document.createElement('span');
          span.className = 'word';
          span.textContent = part;
          words.push(span);
          frag.appendChild(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        wrap(child);
      }
    });
  })(streamText || document.createElement('p'));

  // Figma's LLM Text Animation (818:530): 28 four-word chunks share a 7 s
  // timeline. Each starts 55 ms after the last and eases from blurred,
  // 10 px lower text to its resting position over 550 ms.
  var STREAM_DURATION = 7000;
  var STREAM_STAGGER = 55;
  var STREAM_REVEAL = 550;
  var streamAnimations = [];
  function stopStream() {
    streamAnimations.forEach(function (animation) { animation.cancel(); });
    streamAnimations = [];
  }
  function playStream() {
    stopStream();
    words.forEach(function (w) { w.classList.toggle('is-in', reduceMotion); });
    if (reduceMotion) return;
    words.forEach(function (word, index) {
      var chunkStart = Math.floor(index / 4) * STREAM_STAGGER;
      var start = chunkStart / STREAM_DURATION;
      var end = (chunkStart + STREAM_REVEAL) / STREAM_DURATION;
      var hidden = { opacity: 0, filter: 'blur(3px)', translate: '0 10px' };
      var shown = { opacity: 1, filter: 'blur(0px)', translate: '0 0px' };
      var frames = [Object.assign({ offset: 0 }, hidden)];
      if (start > 0) frames.push(Object.assign({ offset: start, easing: 'ease-out' }, hidden));
      else frames[0].easing = 'ease-out';
      frames.push(Object.assign({ offset: end }, shown));
      frames.push(Object.assign({ offset: 1 }, shown));
      streamAnimations.push(word.animate(frames, { duration: STREAM_DURATION, iterations: Infinity, fill: 'both' }));
    });
  }

  // ---------- Midpoint mode ----------

  var mid = null;
  if (isMid) (function () {
    var panel = root.closest('[data-midpoint-panel]') || document.createElement('div');
    var q = function (name) { return panel.querySelector('[data-mid-' + name + ']') || document.createElement('span'); };
    var pctA = q('a'), pctB = q('b'), controls = q('controls'), hint = q('hint');
    var result = q('result'), resetBtn = q('reset'), percentCard = q('percent'), status = q('status');
    var A = insights[0], B = insights[1];   // weights are [1 - t, t] along A → B, as in the app
    var picked = [];                        // Guide: the Insights chosen with Select, in order
    var selecting = false;
    var ICON = 'assets/home/icon-insight.svg';

    // MidpointHandle: an 18 pt circle with a bubble icon bobbing above it once a second.
    var handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'it-handle';
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-label', 'Midpoint weight toward ' + B.title);
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');
    handle.innerHTML = '<img src="' + ICON + '" alt=""><i></i>';
    layer.appendChild(handle);

    mid = {
      A: A, B: B, handle: handle, phase: 'idle', cam: null, placed: null,
      fade: 0, fadeFrom: 0, fadeTo: 0, fadeStart: 0,       // the unselected tree fading out
      t: new Spring(0.5, 0.2, 0.9),                        // interactiveSpring for Center / keys
      shown: new Spring(0, 0.36, 0.78)                     // springLively handle entrance
    };

    function setFade(to) { mid.fadeFrom = mid.fade; mid.fadeTo = to; mid.fadeStart = performance.now(); }
    function select(on) { A.el.classList.toggle('is-selected', on); B.el.classList.toggle('is-selected', on); }
    function setT(t, animate) {
      t = clamp(t, 0, 1);
      mid.t.target = t;
      if (!animate) { mid.t.v = t; mid.t.vel = 0; }
      var pct = Math.round(t * 100);
      pctA.textContent = (100 - pct) + '%';
      pctB.textContent = pct + '%';
      if (guide) showExample();
      handle.setAttribute('aria-valuenow', pct);
    }
    mid.world = function () {
      var a = treePoint(A), b = treePoint(B), t = clamp(mid.t.v, 0, 1);
      return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), 0];
    };
    function sync() {
      if (guide) return syncGuide();
      var active = mid.phase === 'active';
      // The app's dock: the percent card and Center / Place while choosing, a Thinking status
      // while the placed Insight generates, then the Insight's own card.
      percentCard.hidden = !active;
      controls.hidden = !active;
      status.hidden = active;
      status.textContent = mid.phase === 'loading' || mid.phase === 'revealed' ? 'Thinking' : 'Idle';
      status.classList.toggle('is-thinking', status.textContent === 'Thinking');
      handle.disabled = !active;
      resetBtn.hidden = mid.phase !== 'done';
      hint.textContent = active ? 'Drag the handle toward the idea that should weigh more, then Place.'
        : mid.phase === 'loading' ? 'Finding the concept at that balance…'
        : mid.phase === 'done' ? 'Placed where you set the balance.'
        : 'Two Insights are selected, then Midpoint begins.';
    }

    function enter() {
      if (guide) {
        A = mid.A = picked[0]; B = mid.B = picked[1];
        q('name-a').textContent = A.title; q('name-b').textContent = B.title;
        handle.setAttribute('aria-label', 'Midpoint weight toward ' + B.title);
        dock(null);
        setT(0.5, false);
      }
      mid.phase = 'active';
      select(true);
      setFade(1);
      var a = treePoint(A), b = treePoint(B);
      panTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      // The handle waits for the camera to settle, as in the app.
      later(reduceMotion ? 0 : 680, function () { mid.shown.to(1, 0, performance.now()); });
      sync();
    }

    function place() {
      if (mid.phase !== 'active') return;
      var now = performance.now();
      mid.phase = 'loading';
      var world = mid.world();
      setFade(0);
      mid.shown.to(0, 0, now);
      select(false);
      var chip = document.createElement('div');
      chip.className = 'it-chip it-chip--placed';
      chip.innerHTML = '<svg class="it-chip__loading" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.25.6h7.5c.9 0 1.65.75 1.65 1.65V7.5c0 .9-.75 1.65-1.65 1.65H6.9L3.6 11.4V9.15H2.25C1.35 9.15.6 8.4.6 7.5V2.25C.6 1.35 1.35.6 2.25.6z"/></svg>'
        + '<span class="it-chip__label"><img src="' + ICON + '" alt=""><span>Synderesis</span></span><i class="it-chip__dot"></i>';
      layer.appendChild(chip);
      mid.placed = { el: chip, world: world, vis: new Spring(0) };
      mid.placed.vis.to(1, 0, now);
      panTo(world[0], world[1]);
      // scheduleMidpointReveal: a 3.5 s minimum of loading, then the ripple and the title.
      later(reduceMotion ? 0 : 3500, function () {
        ripple(world, 2.8, 0.5);
        chip.classList.add('is-revealed');
        mid.phase = 'revealed';
        later(reduceMotion ? 0 : 650, function () {
          mid.phase = 'done';
          result.hidden = false;
          panTo(0, 0);
          sync();
        });
      });
      sync();
    }

    function reset() {
      if (mid.placed) { mid.placed.el.remove(); mid.placed = null; }
      result.hidden = true;
      setT(0.5, false);
      enter();
    }

    // Pointer → position along A → B, through the inverse of the flat tree camera.
    function pointerT(e) {
      var cam = mid.cam;
      if (!cam) return mid.t.v;
      var r = root.getBoundingClientRect();
      var wx = (e.clientX - r.left - root.clientLeft - cam.ppx) / cam.zoom + cam.target[0];
      var wy = -(e.clientY - r.top - root.clientTop - cam.ppy) / cam.zoom + cam.target[1];
      var a = treePoint(A), b = treePoint(B), abx = b[0] - a[0], aby = b[1] - a[1];
      return ((wx - a[0]) * abx + (wy - a[1]) * aby) / (abx * abx + aby * aby);
    }
    var grab = 0;
    handle.addEventListener('pointerdown', function (e) {
      if (mid.phase !== 'active') return;
      e.stopPropagation();
      handle.setPointerCapture(e.pointerId);
      handle.classList.add('is-dragging');
      grab = pointerT(e) - mid.t.v;
    });
    handle.addEventListener('pointermove', function (e) {
      if (!handle.classList.contains('is-dragging')) return;
      setT(pointerT(e) - grab, false);
    });
    function release() { handle.classList.remove('is-dragging'); }
    handle.addEventListener('pointerup', release);
    handle.addEventListener('pointercancel', release);
    handle.addEventListener('keydown', function (e) {
      if (mid.phase !== 'active') return;
      var step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 0.05 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -0.05 : 0;
      if (!step) return;
      e.preventDefault();
      setT(mid.t.target + step, true);
    });
    q('center').addEventListener('click', function () { if (mid.phase === 'active') setT(0.5, true); });
    // PercentStepper: each chevron moves that Insight's share by 1%.
    Array.prototype.forEach.call(panel.querySelectorAll('[data-mid-step]'), function (button) {
      var parts = button.dataset.midStep.split(':'), delta = Number(parts[1]) / 100;
      button.addEventListener('click', function () {
        if (mid.phase === 'active') setT(mid.t.target + (parts[0] === 'a' ? -delta : delta), true);
      });
    });
    q('place').addEventListener('click', place);
    resetBtn.addEventListener('click', reset);

    // ---------- Guide example ----------

    var docked = q('docked');
    function dock(ins) {
      var same = ins && docked.dataset.title === ins.title && !docked.hidden;
      docked.hidden = !ins || same;
      docked.dataset.title = ins && !same ? ins.title : '';
      if (ins && !same) {
        q('docked-title').textContent = ins.title;
        q('docked-body').textContent = GUIDE_DEFS[ins.title];
        // Replay the entrance for each new card.
        docked.style.animation = 'none'; void docked.offsetWidth; docked.style.animation = '';
      }
    }
    function showExample() {
      if (mid.phase !== 'active') return;
      var names = [A.title, B.title], r;
      if (names.indexOf('Justice') >= 0 && names.indexOf('Mercy') >= 0) {
        var justice = A.title === 'Justice' ? 1 - mid.t.target : mid.t.target;
        r = justice >= 0.6 ? ['Restorative Justice', 'Giving what is owed in a way that aims to heal the wrong and restore the offender, not only to punish.']
          : justice <= 0.4 ? ['Forgiveness', 'Freely releasing a debt one could justly claim, while still naming the wrong as a wrong.']
          : ['Equity', 'Applying a just rule with mercy when its strict letter would defeat its purpose in a particular case.'];
      } else {
        r = ['A new concept', 'In the app, Angrove proposes a concept that sits between ' + names.join(', ') + ', leaning toward the ideas you weight most.'];
      }
      var title = q('example-title');
      if (title.textContent !== r[0]) {
        title.textContent = r[0];
        q('example-body').textContent = r[1];
        var card = q('example');
        card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
      }
    }
    function label(button, text) { button.querySelector('span').textContent = text; }
    function syncGuide() {
      var active = mid.phase === 'active';
      percentCard.hidden = !active;
      q('example').hidden = !active;
      handle.disabled = !active;
      var sel = q('select'), toggle = q('toggle');
      label(sel, selecting ? 'Done' : 'Select');
      sel.disabled = active;
      label(toggle, active ? 'Back' : 'Midpoint');
      toggle.disabled = !active && picked.length < 2;
      insights.forEach(function (ins) { ins.el.classList.toggle('is-selected', picked.indexOf(ins) >= 0); });
    }
    function exit() {
      mid.phase = 'idle';
      setFade(0);
      mid.shown.to(0, 0, performance.now());
      panTo(0, 0);
      q('example-title').textContent = '';
      sync();
    }
    if (guide) {
      q('select').addEventListener('click', function () {
        if (mid.phase === 'active') return;
        selecting = !selecting;
        dock(null);
        sync();
      });
      q('toggle').addEventListener('click', function () {
        if (mid.phase === 'active') exit();
        else if (picked.length >= 2) { selecting = false; enter(); }
      });
      q('clear').addEventListener('click', function () {
        selecting = false; picked = [];
        dock(null);
        exit();
      });
      // Tapping an Insight selects it while selecting, and otherwise opens its docked card.
      root.addEventListener('click', function (e) {
        if (mid.phase === 'active' || state.step < 2) return;
        if (e.target.closest && e.target.closest('button, .mid-cards')) return;
        var hit = insights.filter(function (ins) {
          var r = ins.el.getBoundingClientRect();
          return e.clientX >= r.left - 6 && e.clientX <= r.right + 6 && e.clientY >= r.top - 6 && e.clientY <= r.bottom + 6;
        })[0];
        if (!hit) { dock(null); return; }
        if (selecting) {
          var at = picked.indexOf(hit);
          if (at >= 0) picked.splice(at, 1);
          else { picked.push(hit); if (picked.length > 2) picked.shift(); }   // this example balances two
          sync();
        } else {
          dock(hit);
        }
      });
    }

    // After the tree has grown: select one Insight, then the other, then enter Midpoint mode.
    mid.begin = function () {
      if (guide) return;
      var t = reduceMotion ? 0 : state.growMs + 500;
      later(t, function () { A.el.classList.add('is-selected'); });
      later(t + (reduceMotion ? 0 : 450), function () { B.el.classList.add('is-selected'); });
      later(t + (reduceMotion ? 0 : 1050), enter);
    };

    setT(0.5, false);
    sync();
  })();

  // ---------- Layout / cameras ----------

  var W = 0, H = 0, DPR = 1;

  function resize() {
    var r = root.getBoundingClientRect();
    W = r.width; H = r.height;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
  }

  function frame() {
    var ui = clamp(W / 700, 0.7, 1);
    var longestBond = Math.max.apply(null, insights.map(function (ins) { return ins.bond; }));
    var chipMargin = longestBond > BOND ? 100 : 70;
    // Midpoint: the docked cards cover the foot of the canvas, so the tree uses the rest.
    var treeH = isMid && !guide ? H - (W < 420 ? 226 : 200) : H;
    var treeZoom = clamp(Math.min(W / 2 - chipMargin * ui, treeH / 2 - 50 * ui) / longestBond, longestBond > BOND ? 0.25 : 0.35, 1.1);
    // StudyFraming scaled to this card: the 300 pt slot, node 40% down, ring 80% down.
    var slot = Math.min(W, H) * 0.6;
    var nodeY = H * 0.4;
    var drop = H * 0.4;
    var studyZoom = 110 / BOND * slot / 300;
    var floorDepth = drop / studyZoom;
    var studyDistance = floorDepth / Math.tan(RING_VIEW_ANGLE);
    var chipRadius = Math.min(W / 2 - chipMargin * ui, H * 0.34);
    var fitZoom = chipRadius / longestBond;
    return {
      ui: ui, treeZoom: treeZoom, treeY: treeH / 2, nodeY: nodeY, studyZoom: studyZoom, fitZoom: fitZoom,
      floorDepth: floorDepth, studyDistance: studyDistance
    };
  }

  // StudyFraming.camera(from: tree, progress: p)
  function camera(f, p, zoomEnd, yaw) {
    return {
      target: [state.panX.v * (1 - p), state.panY.v * (1 - p), 0],
      yaw: yaw * p,
      pitch: lerp(0, STUDY_PITCH, p),
      distance: lerp(FOCAL, f.studyDistance, p),
      zoom: f.treeZoom * Math.pow(zoomEnd / f.treeZoom, p),
      ppx: W / 2,
      ppy: lerp(f.treeY, f.nodeY, p)
    };
  }

  function insightWorld(ins, p) {
    var h = ins.bond;
    var a = ins.ang.v, e = ins.elv.v;
    var tree = [Math.cos(a) * h, Math.sin(a) * h, h * Math.tan(e)];
    if (p <= 0) return tree;
    var dir = slerp(norm(tree), studyDirs[ins.order], p);
    var r = lerp(len(tree), ins.bond, p);
    return [dir[0] * r, dir[1] * r, dir[2] * r];
  }

  // ---------- Drawing ----------

  function drawTreeGrid(cam, f, time, alpha, ripples) {
    if (alpha <= 0.01) return;
    var spacing = 16;
    // 40% past the card's half-diagonal, and centered on where the camera is looking, so the
    // grid's edge never shows while the camera pans to each new Insight.
    var span = 1.4 * (Math.hypot(W, H) / 2) / cam.zoom + spacing * 2;
    var n = Math.ceil(span / spacing);
    var ci = Math.round(cam.target[0] / spacing), cj = Math.round(cam.target[1] / spacing);
    for (var i = ci - n; i <= ci + n; i++) {
      for (var j = cj - n; j <= cj + n; j++) {
        var wx = i * spacing, wy = j * spacing;
        var pr = project(cam, [wx, wy, 0]);
        if (!pr || pr.x < -2 || pr.y < -2 || pr.x > W + 2 || pr.y > H + 2) continue;
        // AnimatedDotGridBackground's normal-strength ripple from each new Insight.
        var boost = 0;
        for (var r = 0; r < ripples.length; r++) {
          var rp = ripples[r];
          // Stronger ripples (a generated Insight) reach farther, run wider, and hit harder.
          var exponent = 4 + Math.max(0, rp.strength - 1) * 3;
          var radius = 400 * rp.strength * rp.radiusScale * (1 - Math.pow(1 - rp.progress, exponent));
          var width = 95 * (0.6 + 0.4 * rp.strength);
          var front = Math.hypot(pr.x - rp.x, pr.y - rp.y) - radius;
          if (front > -width && front < 8) {
            var bump = Math.cos(Math.max(-1, front / width) * Math.PI / 2);
            boost += bump * bump * (1 - Math.pow(rp.progress, 2.2)) * 0.25 * rp.strength;
          }
        }
        if (state.hover.amount > 0.01) {
          var hd = Math.hypot(pr.x - state.hover.x, pr.y - state.hover.y);
          if (hd < 170) boost += 0.2 * state.hover.amount * Math.exp(-(hd * hd) / 6500);
        }
        var o = Math.min((blobOpacity(wx, wy, time) + boost) * 1.6, 0.85) * alpha;
        var rad = 0.9 * pr.scale;
        ctx.fillStyle = 'rgba(' + BROWN + ',' + o.toFixed(3) + ')';
        ctx.fillRect(pr.x - rad, pr.y - rad, rad * 2, rad * 2);
      }
    }
  }

  function drawFloor(cam, f, time, alpha) {
    if (alpha <= 0.01 || Math.sin(cam.pitch) < 0.2) return;
    var spacing = 20 / f.studyZoom;
    var reach = cam.distance * 1.5;
    var n = 46;
    for (var i = -n; i <= n; i++) {
      for (var j = -n; j <= n; j++) {
        var pr = project(cam, [i * spacing, j * spacing, -f.floorDepth]);
        if (!pr || pr.depth < cam.distance * 0.15) continue;
        if (pr.x < -4 || pr.x > W + 4 || pr.y < -4 || pr.y > H + 4) continue;
        var beyond = clamp((pr.depth - cam.distance) / reach, 0, 1);
        var edge = clamp((beyond - 0.4) / 0.6, 0, 1);
        var radial = 1 - smoothstep(n * 0.6, n, Math.hypot(i, j));
        var fade = (1 - edge * edge * (3 - 2 * edge)) * radial;
        if (fade < 0.01) continue;
        var o = Math.min(blobOpacity(i * 16, j * 16, time) * 1.6, 0.85) * fade * 0.5 * alpha;
        var rad = clamp(0.9 * pr.scale * cam.zoom / f.studyZoom, 0.35, 2);
        ctx.fillStyle = 'rgba(' + BROWN + ',' + o.toFixed(3) + ')';
        ctx.fillRect(pr.x - rad, pr.y - rad, rad * 2, rad * 2);
      }
    }
  }

  // StudyFloorRing: 60 dashes turned by yaw, 3 pt stroke, gradient 5% (far) to 40% (near).
  function drawRing(f, p, yaw, alpha) {
    if (alpha <= 0.01) return;
    var ringCam = camera(f, p, f.studyZoom, 0);
    var R = BOND * RING_RATIO;
    var slot = 2 * Math.PI / DASHES;
    var minY = Infinity, maxY = -Infinity;
    var dashes = [];
    for (var d = 0; d < DASHES; d++) {
      var start = d * slot - yaw;
      var pts = [];
      for (var s = 0; s <= 4; s++) {
        var a = start + slot * DASH_FILL * s / 4;
        var pr = project(ringCam, [Math.cos(a) * R, Math.sin(a) * R, -f.floorDepth]);
        if (pr) { pts.push(pr); minY = Math.min(minY, pr.y); maxY = Math.max(maxY, pr.y); }
      }
      dashes.push(pts);
    }
    if (!isFinite(minY)) return;
    var grad = ctx.createLinearGradient(0, minY + (maxY - minY) * 0.37, 0, maxY);
    grad.addColorStop(0, 'rgba(' + BROWN + ',' + (0.05 * alpha) + ')');
    grad.addColorStop(1, 'rgba(' + BROWN + ',' + (0.4 * alpha) + ')');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    dashes.forEach(function (pts) {
      if (pts.length < 2) return;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
    });
    ctx.stroke();
  }

  // Use the ring's projected width for the same points-to-radians mapping as
  // InsightTreeCanvasView.studyDragGesture in the app.
  function ringHalfWidth() {
    var f = frame();
    var cam = camera(f, state.p, f.studyZoom, 0);
    var radius = BOND * RING_RATIO;
    var minX = Infinity, maxX = -Infinity;
    for (var i = 0; i < 64; i++) {
      var angle = i * Math.PI * 2 / 64;
      var point = project(cam, [Math.cos(angle) * radius, Math.sin(angle) * radius, -f.floorDepth]);
      if (!point) continue;
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
    }
    return isFinite(minX) ? Math.max((maxX - minX) / 2, 40) : 150;
  }

  function styleEl(elm, x, y, scale, opacity, rise, blur, z) {
    elm.style.transform = 'translate(' + x.toFixed(1) + 'px,' + (y + rise).toFixed(1) + 'px) translate(-50%,-50%) scale(' + scale.toFixed(3) + ')';
    elm.style.opacity = clamp(opacity, 0, 1).toFixed(3);
    elm.style.filter = blur > 0.05 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none';
    elm.style.zIndex = z;
  }

  // ---------- Loop ----------

  var last = performance.now();
  var running = false;

  function tick(now) {
    if (!running) return;
    if (journeyScene && !journeyScene.classList.contains('is-active')) {
      last = now;
      requestAnimationFrame(tick);
      return;
    }
    var dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    var time = now / 1000;

    node.vis.step(dt, now);
    insights.forEach(function (i) { i.vis.step(dt, now); i.ang.step(dt, now); i.elv.step(dt, now); });
    state.panX.step(dt, now); state.panY.step(dt, now);
    if (mid) {
      mid.t.step(dt, now); mid.shown.step(dt, now);
      if (mid.placed) mid.placed.vis.step(dt, now);
      // The app fades the unselected tree with easeInOut over 0.3 s.
      var fadeT = reduceMotion ? 1 : clamp((now - mid.fadeStart) / 300, 0, 1);
      mid.fade = lerp(mid.fadeFrom, mid.fadeTo, easeInOut(fadeT));
    }
    var rest = mid ? 1 - mid.fade : 1;   // opacity of everything outside a Midpoint selection

    // Study progress: an eased 0.8 s swing, like the app's camera move.
    var dur = reduceMotion ? 1 : 800;
    var t = clamp((now - state.pStart) / dur, 0, 1);
    state.p = studyProgress === null ? lerp(state.pFrom, state.pTo, easeInOut(t)) : studyProgress;
    var p = state.p;

    // Match the app's Study ring coast: cap frame time, decay at 3.2/s, stop at 0.05 rad/s.
    if (state.introSpin && p > 0.98) { state.introSpin = false; state.spinVel = 1.1; }
    if (!state.dragging && Math.abs(state.spinVel) >= 0.05) {
      var spinDt = Math.min(dt, 1 / 30);
      state.yaw += state.spinVel * spinDt;
      state.spinVel *= Math.exp(-3.2 * spinDt);
      if (Math.abs(state.spinVel) < 0.05) state.spinVel = 0;
    }

    var f = frame();
    var cam = camera(f, p, f.fitZoom, state.yaw);
    state.cam = cam;
    state.hover.amount += ((state.hover.on && p < 0.05 ? 1 : 0) - state.hover.amount) * Math.min(1, dt * 7);
    if (mid) mid.cam = cam;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var gridTime = state.step >= 2 && !reduceMotion ? time : 0;
    state.ripples = state.ripples.filter(function (r) { return time - r.start < r.duration; });
    var ripples = [];
    state.ripples.forEach(function (r) {
      var o = project(cam, r.world);
      if (o) ripples.push({ x: o.x, y: o.y, progress: (time - r.start) / r.duration, strength: r.strength, radiusScale: r.radiusScale });
    });
    drawTreeGrid(cam, f, gridTime, Math.pow(1 - p, 2) * node.vis.v, ripples);
    drawFloor(cam, f, 0, p);
    drawRing(f, p, state.yaw, p);

    var nodeProj = project(cam, [0, 0, 0]);
    var nv = clamp(node.vis.v, 0, 1);
    styleEl(node.el, nodeProj.x, nodeProj.y, f.ui * nodeProj.scale, nv * rest, (1 - nv) * 24, (1 - nv) * 8, 10);

    ctx.lineWidth = 1;
    insights.forEach(function (ins) {
      var world = insightWorld(ins, p);
      var pr = project(cam, world);
      if (!pr) return;
      var v = clamp(ins.vis.v, 0, 1);
      var behind = smoothstep(-0.25 * BOND, 0.25 * BOND, pr.depth - nodeProj.depth) * p;
      var dim = 1 - 0.4 * behind;

      // Connector drawn out from the Node Concept to the chip once the chip has landed.
      if (ins.lineStart !== null) {
        var g = clamp((now - ins.lineStart) / (CONNECTOR_GROW * 1000), 0, 1);
        g = 1 - Math.pow(1 - g, 5);
        var ca = (scrollStudy ? 0.5 : 0.22) * dim * rest;
        if (g > 0.001) {
          if (scrollStudy) {
            // Fade over the full connector so its entrance and 3D rotation keep the same falloff.
            var connector = ctx.createLinearGradient(nodeProj.x, nodeProj.y, pr.x, pr.y);
            connector.addColorStop(0, 'rgba(' + BROWN + ',' + (ca * 0.08).toFixed(3) + ')');
            connector.addColorStop(0.18, 'rgba(' + BROWN + ',' + (ca * 0.35).toFixed(3) + ')');
            connector.addColorStop(0.5, 'rgba(' + BROWN + ',' + ca.toFixed(3) + ')');
            connector.addColorStop(1, 'rgba(' + BROWN + ',' + ca.toFixed(3) + ')');
            ctx.strokeStyle = connector;
          } else {
            ctx.strokeStyle = 'rgba(' + BROWN + ',' + ca.toFixed(3) + ')';
          }
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(nodeProj.x, nodeProj.y);
          ctx.lineTo(lerp(nodeProj.x, pr.x, g), lerp(nodeProj.y, pr.y, g));
          ctx.stroke();
        }
      }
      var keep = mid && (ins === mid.A || ins === mid.B) ? 1 : rest;
      styleEl(ins.el, pr.x, pr.y, f.ui * pr.scale, v * dim * keep, (1 - v) * 24, (1 - v) * 8,
        behind > 0.5 ? 5 : 30 + Math.round(pr.scale * 5));
    });

    if (mid) {
      var pa = project(cam, treePoint(mid.A)), pb = project(cam, treePoint(mid.B));
      // The selection's connecting line: lightGreen at 85%, 1.5 pt.
      if (mid.fade > 0.01) {
        ctx.strokeStyle = 'rgba(134, 128, 62,' + (0.85 * mid.fade).toFixed(3) + ')';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }
      var hv = clamp(mid.shown.v, 0, 1.2);
      var hp = project(cam, mid.world());
      mid.handle.style.transform = 'translate(' + hp.x.toFixed(1) + 'px,' + hp.y.toFixed(1) + 'px) translate(-50%,-50%) scale(' + lerp(0.3, 1, hv).toFixed(3) + ')';
      mid.handle.style.opacity = clamp(hv, 0, 1).toFixed(3);
      mid.handle.style.visibility = hv > 0.01 ? 'visible' : 'hidden';

      // A placed Midpoint: lines to both of its sources, and its chip pinned where it was placed.
      if (mid.placed) {
        var pv = clamp(mid.placed.vis.v, 0, 1);
        var pp = project(cam, mid.placed.world);
        ctx.strokeStyle = 'rgba(' + BROWN + ',' + (0.22 * pv * rest).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y); ctx.lineTo(pp.x, pp.y);
        ctx.moveTo(pb.x, pb.y); ctx.lineTo(pp.x, pp.y);
        ctx.stroke();
        styleEl(mid.placed.el, pp.x, pp.y, f.ui * pp.scale, pv, (1 - pv) * 24, (1 - pv) * 8, 40);
      }
    }

    requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  }

  // ---------- Input ----------

  root.addEventListener('pointerdown', function (e) {
    if (state.step < 3 || state.p < 0.95) return;
    state.dragging = true; state.lastX = e.clientX; state.lastT = performance.now();
    state.ringHalfWidth = ringHalfWidth();
    state.spinVel = 0; state.introSpin = false;
    root.setPointerCapture(e.pointerId);
    root.classList.add('is-dragging');
  });
  root.addEventListener('pointermove', function (e) {
    if (!state.dragging) return;
    var now = performance.now();
    var dYaw = -(e.clientX - state.lastX) / state.ringHalfWidth;
    state.yaw += dYaw;
    var dt = Math.max((now - state.lastT) / 1000, 1 / 240);
    state.spinVel = lerp(state.spinVel, dYaw / dt, 0.5);
    state.lastX = e.clientX; state.lastT = now;
    if (Math.abs(dYaw) > 0.01 && !state.userSpun) { state.userSpun = true; root.classList.add('has-spun'); }
  });
  function endDrag(coast) {
    if (!state.dragging) return;
    state.dragging = false;
    if (!coast || performance.now() - state.lastT > 80 || Math.abs(state.spinVel) <= 0.3) {
      state.spinVel = 0;
    } else {
      state.spinVel = clamp(state.spinVel, -12, 12);
    }
    root.classList.remove('is-dragging');
  }
  root.addEventListener('pointerup', function () { endDrag(true); });

  // The dot grid answers the pointer: a soft glow follows it, and a press ripples outward from
  // that spot, as tapping the canvas does in the app. Tree view only, not Study.
  function localPoint(e) {
    var r = root.getBoundingClientRect();
    return { x: e.clientX - r.left - root.clientLeft, y: e.clientY - r.top - root.clientTop };
  }
  root.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var pt = localPoint(e);
    state.hover.x = pt.x; state.hover.y = pt.y; state.hover.on = true;
  });
  root.addEventListener('pointerleave', function () { state.hover.on = false; });
  root.addEventListener('pointerdown', function (e) {
    var cam = state.cam;
    if (!cam || state.step < 2 || state.p > 0.05 || reduceMotion) return;
    if (e.target.closest && e.target.closest('button, .mid-cards')) return;
    var pt = localPoint(e);
    ripple([(pt.x - cam.ppx) / cam.zoom + cam.target[0], -(pt.y - cam.ppy) / cam.zoom + cam.target[1], 0]);
  });
  root.addEventListener('pointercancel', function () { endDrag(false); });

  // ---------- Wiring ----------

  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(root);
  else window.addEventListener('resize', resize);

  if (!mode) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; readStep(); });
    }, { passive: true });
    window.addEventListener('resize', readStep);
    readStep();
  } else {
    // Replay each time the window comes back into view.
    // Study mode lets the tree grow first, then swings the camera down into 3D.
    var studyTimer = null;
    var onView = function (visible) {
      clearTimeout(studyTimer);
      if (visible) {
        if (mode === 'stream') { setStep(1); return; }
        if (state.step >= 2) return;
        setStep(2);
        if (mid) mid.begin();
        if (mode === 'study') studyTimer = setTimeout(function () { setStep(3); }, reduceMotion ? 0 : state.growMs + 600);
      } else if (!state.userSpun && !mid) {
        setStep(0);
      }
    };
    if (journeyScene) {
      root.addEventListener('journey:play', function () { onView(true); });
    } else {
      new IntersectionObserver(function (entries) { onView(entries[0].isIntersecting); }, { threshold: 0.35 }).observe(root);
    }
  }

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) start();
    else running = false;
  }, { rootMargin: '200px' }).observe(root);
  }
})();
