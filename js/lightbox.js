// Photos and videos open larger: clicked (or Return/Space when focused), one grows from its place
// to fill the screen while the page darkens behind it. A click, Esc, or scrolling sends it back.
// The element itself moves into the lightbox, so a video keeps playing; a video that has finished
// plays again. Decorative images (empty alt), the nav and footer, links elsewhere, and anything
// marked data-no-lightbox are left alone; an image linked to its own file opens here instead.
// Under it sit its heading and a line about it: data-caption-title and data-caption, else the
// figure's caption when the figure holds only this media, else its alt text.
// On hover (mouse or trackpad) each one grows 1% and turns slightly to face the cursor.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The mobile menu's curve and timing (--ease-menu: 0.6s, its fade 0.45s), both ways.
  var EASE = 'cubic-bezier(0.55, 0, 0.17, 1)';
  function margin() { return innerWidth < 600 ? 16 : 56; }   // around the enlarged media
  function pad() { return innerWidth < 600 ? 8 : 18; }        // the paper mount around it
  var GAP = 20;        // between it and its caption
  var OPEN_MS = reduce ? 0 : 600, CLOSE_MS = reduce ? 0 : 600, FADE_MS = reduce ? 0 : 450;
  var TILT = 1.5; // degrees at the edges: a gentle response
  var POLAROID = '.hero__portrait, .contact__photo';
  var polaroidScenes = new WeakMap(), polaroidLoading = new WeakMap();
  var polaroidModule = null;

  function preparePolaroid(photo, image) {
    if (polaroidLoading.has(photo)) return polaroidLoading.get(photo);
    if (!polaroidModule) polaroidModule = import('../assets/polaroid-3d.js?v=20261104-inline-1');
    var ready = polaroidModule.then(function (module) {
      return module.createInspector(photo, image, photo, reduce);
    }).then(function (inspector) {
      polaroidScenes.set(photo, inspector);
      photo.classList.add('has-polaroid-mesh');
      inspector.canvas.classList.add('is-ready');
      return inspector;
    }).catch(function () {
      // Keep the original paper print usable when WebGL is unavailable.
      return null;
    });
    polaroidLoading.set(photo, ready);
    return ready;
  }

  var IMAGE_FILE = /\.(jpe?g|png|webp|gif|avif)([?#]|$)/i;
  var media = Array.prototype.filter.call(document.querySelectorAll('img, video'), function (m) {
    if (m.getAttribute('alt') === '' || m.closest('.nav, .footer, [aria-hidden="true"], [data-no-lightbox], button')) return false;
    var link = m.closest('a');
    return !link || IMAGE_FILE.test(link.getAttribute('href') || '');
  });
  if (!media.length) return;

  media.forEach(function (m) {
    var target = m.closest(POLAROID) || m;
    target.classList.add('lightbox-target');
    var link = m.closest('a');
    if (link) {
      // The link stays the keyboard stop; its click opens the image here rather than leaving.
      link.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || shown) return;
        if (requestOpen(m, e)) e.preventDefault();
      });
    } else {
      target.tabIndex = 0;
      target.setAttribute('role', 'button');
      if (target !== m) target.setAttribute('aria-label', m.getAttribute('alt'));
      target.addEventListener('click', function (e) { requestOpen(m, e); });
      target.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); requestOpen(m, e); }
      });
    }
    if (!reduce && !m.closest(POLAROID)) {
      m.addEventListener('pointermove', function (e) { tilt(m, e); });
      m.addEventListener('pointerleave', function () { untilt(m); });
    }
  });

  // Render each print as it approaches the page viewport. The renderer and mesh
  // stay inside that print throughout opening, inspection, and its return home.
  var printObserver = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      preparePolaroid(entry.target, entry.target.querySelector('img'));
      printObserver.unobserve(entry.target);
    });
  }, { rootMargin: '240px' }) : null;
  media.forEach(function (m) {
    var photo = m.closest(POLAROID);
    if (!photo) return;
    if (printObserver) printObserver.observe(photo); else preparePolaroid(photo, m);
  });

  // The face turns toward the cursor: cursor right turns it right, cursor low turns it down.
  function tilt(m, e) {
    if (e.pointerType === 'touch' || shown) return;
    var r = m.getBoundingClientRect();
    var nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    var ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    // Reduce cursor influence near the center instead of tracking every movement directly.
    nx *= Math.abs(nx);
    ny *= Math.abs(ny);
    m.style.setProperty('--tilt-y', (nx * TILT).toFixed(2) + 'deg');
    m.style.setProperty('--tilt-x', (-ny * TILT).toFixed(2) + 'deg');
    m.classList.add('is-hovered');
  }
  function untilt(m) {
    m.classList.remove('is-hovered');
    m.style.removeProperty('--tilt-x');
    m.style.removeProperty('--tilt-y');
  }

  var shown = null;   // { media, placeholder, scrim, style, offset, rect, focus }
  var opening = null;

  function slideClip(clip, away) {
    return clip.animate(away ? [
      { transform: 'none', opacity: 1 },
      { transform: 'translate(0, -72px)', opacity: 0 }
    ] : [
      { transform: 'translate(0, -72px)', opacity: 0 },
      { transform: 'translate(0, 2px)', opacity: 1, offset: 0.8 },
      { transform: 'none', opacity: 1 }
    ], { duration: reduce ? 0 : (away ? 300 : 400), easing: EASE, fill: 'forwards' });
  }

  function restoreClip(state) {
    var back = slideClip(state.clip, false);
    back.finished.then(function () {
      state.motion.cancel();
      back.cancel();
      delete state.holder.dataset.busy;
    });
  }

  function requestOpen(m, event) {
    if (shown || opening) return false;
    var holder = m.closest(POLAROID);
    var clip = holder && holder.querySelector('.hero__clip, .contact__clip');
    if (!clip) {
      if (!open(m)) return false;
      shown.openedBy = event;
      return true;
    }
    if (holder.dataset.busy || (holder.matches('.hero__portrait') && !document.documentElement.classList.contains('is-placed'))) return false;
    holder.dataset.busy = 'lightbox';
    // Let the photo leave from its resting place, after the clip has slid clear.
    holder.getAnimations().forEach(function (motion) { motion.cancel(); });
    var state = { holder: holder, clip: clip, motion: slideClip(clip, true) };
    opening = state;
    Promise.all([state.motion.finished, preparePolaroid(holder, m)]).then(function () {
      if (opening !== state) return;
      opening = null;
      if (open(m)) {
        shown.openedBy = event;
        shown.clipState = state;
      } else restoreClip(state);
    });
    return true;
  }

  function open(m) {
    if (shown) return false;
    var portrait = m.closest(POLAROID);
    if (portrait) return openPolaroid(portrait, m);
    var rect = m.getBoundingClientRect();
    if (rect.width < 120 || rect.height < 80) return false;   // hidden or too small to need it
    // Where it rests, without the hover's lift and tilt: where it returns to on close. The
    // transition is held off so this reads the resting place, not the hover mid-animation.
    m.style.setProperty('transition', 'none', 'important');
    m.style.setProperty('transform', 'none', 'important');
    m.style.setProperty('scale', 'none', 'important');
    var rest = m.getBoundingClientRect();
    untilt(m);
    m.style.removeProperty('transform');
    m.style.removeProperty('scale');
    m.style.removeProperty('transition');
    var cs = getComputedStyle(m);
    var MARGIN = margin(), PAD = pad();

    var scrim = document.createElement('div');
    scrim.className = 'lightbox';
    scrim.setAttribute('role', 'dialog');
    scrim.setAttribute('aria-modal', 'true');
    scrim.tabIndex = -1;
    // The dark layer fades on its own, so the media never fades with it.
    var shade = document.createElement('div');
    shade.className = 'lightbox__shade';
    scrim.appendChild(shade);
    // On the viewing table the media rests on a paper mount with crop marks and a scale.
    var mount = document.createElement('div');
    mount.className = 'lightbox__mount';
    var scaleBar = document.createElement('span');
    scaleBar.className = 'lightbox__scale';
    mount.appendChild(scaleBar);
    scrim.appendChild(mount);
    document.body.appendChild(scrim);

    // The caption is measured first so the media fits the room it leaves.
    var caption = null, room = 0;
    var title = m.getAttribute('data-caption-title'), about = m.getAttribute('data-caption');
    if (!title && !about) {
      var figure = m.closest('figure'), figcaption = figure && figure.querySelector('figcaption');
      if (figcaption && figure.querySelectorAll('img, video').length === 1) {
        var head = figcaption.querySelector('h1, h2, h3, h4, h5, h6'), line = figcaption.querySelector('p');
        title = head && head.textContent.trim();
        about = line && line.textContent.trim();
        if (!title && !about) {
          var label = figcaption.querySelector('.label');
          title = label && label.textContent.trim();
          about = figcaption.textContent.replace(title || '', '').trim();
        }
      }
      if (!title && !about) about = m.getAttribute('alt') || m.getAttribute('aria-label');
    }
    if (title || about) {
      caption = document.createElement('div');
      caption.className = 'lightbox__caption';
      caption.id = 'lightbox-caption';
      if (title) caption.appendChild(text('h2', 'lightbox__title', title));
      if (about) caption.appendChild(text('p', 'lightbox__text', about));
      caption.style.width = Math.min(640, innerWidth - MARGIN * 2) + 'px';
      caption.style.boxSizing = 'border-box';
      scrim.appendChild(caption);
      room = caption.offsetHeight + GAP + PAD;
      scrim.setAttribute('aria-labelledby', caption.id);
    } else {
      scrim.setAttribute('aria-label', m.getAttribute('alt') || m.getAttribute('aria-label') || 'Enlarged media');
    }

    // Fit the screen less a margin and the caption, never past the file's own size.
    var natural = m.naturalWidth || m.videoWidth || +m.getAttribute('width') || rect.width;
    var scale = Math.min((innerWidth - (MARGIN + PAD) * 2) / rest.width, (innerHeight - (MARGIN + PAD) * 2 - room) / rest.height);
    scale = Math.max(Math.min(1, scale), Math.min(scale, natural / rest.width));
    var w = rest.width * scale, h = rest.height * scale;
    var left = (innerWidth - w) / 2, top = (innerHeight - h - room) / 2;
    if (caption) {
      // Window captures carry a transparent shadow margin; the caption sits under the window.
      var inset = m.classList.contains('mac-shot') ? h * 0.04 : 0;
      caption.style.left = innerWidth / 2 + 'px';
      caption.style.top = (top + h - inset + PAD + GAP) + 'px';
    }

    mount.style.cssText = 'left:' + (left - PAD) + 'px;top:' + (top - PAD) + 'px;width:' + (w + PAD * 2) + 'px;height:' + (h + PAD * 2) + 'px';

    // A stand-in holds its place in the page while it is away.
    var placeholder = document.createElement('span');
    placeholder.style.cssText = 'display:' + (cs.display === 'inline' ? 'inline-block' : cs.display) +
      ';width:' + m.offsetWidth + 'px;height:' + m.offsetHeight + 'px;margin:' + cs.margin + ';vertical-align:' + cs.verticalAlign;

    var style = m.getAttribute('style');
    var fit = cs.objectFit;
    // Corners set in px grow with it, so a phone recording keeps its shape.
    var radius = /%/.test(cs.borderRadius) ? cs.borderRadius : cs.borderRadius.replace(/[\d.]+px/g, function (v) { return parseFloat(v) * scale + 'px'; });
    m.replaceWith(placeholder);    // moved in one task, so a playing video doesn't pause
    scrim.appendChild(m);
    var pr = placeholder.getBoundingClientRect();
    m.style.cssText = 'position:fixed!important;left:' + left + 'px!important;top:' + top + 'px!important;' +
      'width:' + w + 'px!important;height:' + h + 'px!important;max-width:none!important;max-height:none!important;' +
      'margin:0!important;translate:none!important;transform-origin:0 0;border-radius:' + radius + ';object-fit:' + fit;
    m.classList.add('lightbox__media');

    shown = {
      media: m, placeholder: placeholder, scrim: scrim, shade: shade, mount: mount, caption: caption, style: style, focus: document.activeElement,
      offset: { x: rest.left - pr.left, y: rest.top - pr.top }, size: { w: w, h: h }, at: { x: left, y: top }
    };

    m.animate([{ transform: from(rect) }, { transform: 'none' }], { duration: OPEN_MS, easing: EASE });
    shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: EASE, fill: 'forwards' });
    mount.animate([{ opacity: 0, transform: 'scale(0.97)' }, { opacity: 1, transform: 'none' }], { duration: reduce ? 0 : 420, delay: reduce ? 0 : 260, easing: 'ease-out', fill: 'backwards' });
    if (caption) caption.animate([
      { opacity: 0, filter: 'blur(8px)', transform: 'translateY(6px)' },
      { opacity: 1, filter: 'blur(0)', transform: 'none' }
    ], { duration: reduce ? 0 : 400, delay: reduce ? 0 : 150, easing: 'ease-out', fill: 'backwards' });
    scrim.focus({ preventScroll: true });

    if (m.tagName === 'VIDEO' && !reduce && (m.paused || m.ended)) {
      if (m.ended) m.currentTime = 0;
      var playing = m.play();
      if (playing && playing.catch) playing.catch(function () {});
    }
    return true;
  }

  // Carry the actual paper print, keeping its border and handwritten caption together.
  // Scale the print as a unit so the paper and lettering retain their proportions.
  function openPolaroid(photo, img) {
    var rect = photo.getBoundingClientRect();
    if (rect.width < 120 || rect.height < 80) return false;
    var width = photo.offsetWidth, height = photo.offsetHeight;
    var angle = getComputedStyle(photo).rotate;
    var scale = Math.min((innerWidth - 64) / width, (innerHeight - 180) / height, 560 / height) * 0.9;
    var left = (innerWidth - width) / 2, top = (innerHeight - height) / 2;
    var placeholder = photo.cloneNode(false);
    placeholder.removeAttribute('tabindex');
    placeholder.removeAttribute('role');
    placeholder.removeAttribute('aria-label');
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.setAttribute('data-lightbox-placeholder', '');
    placeholder.style.cssText = 'width:' + width + 'px;height:' + height + 'px;visibility:hidden;pointer-events:none';
    var scrim = document.createElement('div');
    scrim.className = 'lightbox lightbox--polaroid';
    scrim.setAttribute('role', 'dialog');
    scrim.setAttribute('aria-modal', 'true');
    scrim.setAttribute('aria-label', img.getAttribute('alt'));
    scrim.tabIndex = -1;
    var shade = document.createElement('div');
    shade.className = 'lightbox__shade';
    scrim.appendChild(shade);
    var style = photo.getAttribute('style');
    var focus = document.activeElement;
    photo.replaceWith(placeholder);
    scrim.appendChild(photo);
    document.body.appendChild(scrim);
    photo.classList.add('lightbox__media', 'lightbox__polaroid');
    photo.style.cssText = 'position:fixed!important;left:' + left + 'px!important;top:' + top + 'px!important;' +
      'right:auto!important;width:' + width + 'px!important;height:' + height + 'px!important;' +
      'max-width:none!important;margin:0!important;rotate:0deg!important;scale:none!important;' +
      'transform-origin:center;transform:scale(' + scale + ');transition:none!important';
    // A focused print is now the dialog content rather than another open button.
    photo.removeAttribute('tabindex');
    photo.removeAttribute('role');
    shown = {
      media: photo, placeholder: placeholder, scrim: scrim, shade: shade, style: style, focus: focus,
      offset: { x: 0, y: 0 }, size: { w: width, h: height }, at: { x: left, y: top },
      polaroid: true, angle: angle, restTransform: 'scale(' + scale + ')', inspector: polaroidScenes.get(photo)
    };
    var state = shown;
    if (state.inspector) state.inspector.setViewport((innerWidth - 48) / scale, (innerHeight - 150) / scale);
    var entrance = photo.animate([{ transform: from(rect) }, { transform: shown.restTransform }], { duration: OPEN_MS, easing: EASE });
    entrance.finished.then(function () { state.rotationReady = true; });
    enableRotation(state, scale);
    shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: EASE, fill: 'forwards' });
    scrim.focus({ preventScroll: true });
    return true;
  }

  function enableRotation(state, scale) {
    var photo = state.media, scrim = state.scrim;
    var controller = new AbortController(), options = { signal: controller.signal };
    state.rotationController = controller;
    state.edges = (state.inspector ? [] : ['top', 'right', 'bottom', 'left']).map(function (side) {
      var edge = document.createElement('span');
      edge.className = 'lightbox__edge lightbox__edge--' + side;
      edge.setAttribute('aria-hidden', 'true');
      photo.appendChild(edge);
      return edge;
    });
    var hint = text('p', 'lightbox__hint', 'Drag to rotate · Arrow keys to turn · Home to reset');
    hint.id = 'polaroid-controls';
    scrim.setAttribute('aria-describedby', hint.id);
    scrim.appendChild(hint);
    var dismiss = text('button', 'lightbox__close', 'Close');
    dismiss.type = 'button';
    dismiss.addEventListener('click', function (e) { e.stopPropagation(); close(); }, options);
    scrim.appendChild(dismiss);
    var x = 0, y = 0, drag = null;
    function turn() {
      state.rotation = { x: x, y: y };
      state.restTransform = 'scale(' + scale + ')' + (state.inspector ? '' : ' rotateX(' + x + 'deg) rotateY(' + y + 'deg)');
      photo.style.transform = state.restTransform;
      if (state.inspector) state.inspector.setRotation(x, y);
    }
    photo.addEventListener('dragstart', function (e) { e.preventDefault(); }, options);
    scrim.addEventListener('pointerdown', function (e) {
      if (!photo.contains(e.target) && !(state.inspector && e.target === state.inspector.canvas)) return;
      if (!state.rotationReady || state.closing || drag || !e.isPrimary || e.button !== 0) return;
      e.preventDefault();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      scrim.setPointerCapture(e.pointerId);
      photo.classList.add('is-rotating');
      scrim.classList.add('is-rotating');
    }, options);
    scrim.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      y += (e.clientX - drag.x) * 0.45;
      x -= (e.clientY - drag.y) * 0.45;
      drag.x = e.clientX;
      drag.y = e.clientY;
      turn();
    }, options);
    function release(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      photo.classList.remove('is-rotating');
      scrim.classList.remove('is-rotating');
      if (scrim.hasPointerCapture(e.pointerId)) scrim.releasePointerCapture(e.pointerId);
    }
    scrim.addEventListener('pointerup', release, options);
    scrim.addEventListener('pointercancel', release, options);
    scrim.addEventListener('lostpointercapture', release, options);
    // Captured pointer events target the scrim; their synthetic click must not close it.
    scrim.addEventListener('click', function (e) {
      if (e.target === scrim || photo.contains(e.target) || (state.inspector && e.target === state.inspector.canvas)) e.stopPropagation();
    }, options);
    scrim.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        (document.activeElement === dismiss ? scrim : dismiss).focus({ preventScroll: true });
        return;
      }
      if (!state.rotationReady || state.closing || !/^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home)$/.test(e.key)) return;
      e.preventDefault();
      if (e.key === 'Home') { x = 0; y = 0; }
      if (e.key === 'ArrowLeft') y -= 15;
      if (e.key === 'ArrowRight') y += 15;
      if (e.key === 'ArrowUp') x += 15;
      if (e.key === 'ArrowDown') x -= 15;
      turn();
    }, options);
  }

  function text(tag, cls, value) {
    var node = document.createElement(tag);
    node.className = cls;
    node.textContent = value;
    return node;
  }

  // The transform that puts the enlarged element back over a rect on the page.
  function from(rect) {
    var s = shown.size, a = shown.at;
    if (shown.polaroid) return 'translate(' + (rect.left + rect.width / 2 - a.x - s.w / 2) + 'px, ' +
      (rect.top + rect.height / 2 - a.y - s.h / 2) + 'px) rotate(' + shown.angle + ')';
    return 'translate(' + (rect.left - a.x) + 'px, ' + (rect.top - a.y) + 'px) scale(' + (rect.width / s.w) + ', ' + (rect.height / s.h) + ')';
  }

  function close() {
    if (opening) {
      var pending = opening;
      opening = null;
      restoreClip(pending);
      return;
    }
    if (!shown || shown.closing) return;
    var s = shown;
    s.closing = true;
    if (s.rotationController) s.rotationController.abort();
    if (s.inspector) {
      s.inspector.setRotation(0, 0);
      s.inspector.setViewport(null, null);
    }
    s.media.classList.remove('is-rotating');
    var pr = s.placeholder.getBoundingClientRect();
    var home = { left: pr.left + s.offset.x, top: pr.top + s.offset.y, width: pr.width, height: pr.height };
    var back = s.media.animate([{ transform: s.restTransform || 'none' }, { transform: from(home) }], { duration: CLOSE_MS, easing: EASE, fill: 'forwards' });
    if (s.caption) s.caption.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS * 0.5, easing: 'ease-in', fill: 'forwards' });
    s.shade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: EASE, fill: 'forwards' });
    if (s.mount) s.mount.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS * 0.4, easing: 'ease-in', fill: 'forwards' });
    back.finished.then(function () {
      s.placeholder.replaceWith(s.media);
      s.media.classList.remove('lightbox__media', 'lightbox__polaroid');
      if (s.edges) s.edges.forEach(function (edge) { edge.remove(); });
      back.cancel();
      if (s.style == null) s.media.removeAttribute('style'); else s.media.setAttribute('style', s.style);
      if (s.polaroid) {
        s.media.tabIndex = 0;
        s.media.setAttribute('role', 'button');
      }
      s.scrim.remove();
      if (s.focus && s.focus.focus) s.focus.focus({ preventScroll: true });
      shown = null;
      if (s.clipState) restoreClip(s.clipState);
    });
  }

  document.addEventListener('click', function (e) {
    if (shown && shown.polaroid && shown.media.contains(e.target)) return;
    // The click that opened it bubbles here too, now from inside the lightbox: not a close.
    if (shown && e !== shown.openedBy && shown.scrim.contains(e.target)) { e.preventDefault(); close(); }
  });
  document.addEventListener('keydown', function (e) { if ((shown || opening) && e.key === 'Escape') close(); });
  // Scrolling closes it rather than moving the page underneath.
  window.addEventListener('wheel', function (e) {
    if (!shown && !opening) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    close();
  }, { capture: true, passive: false });
  window.addEventListener('touchmove', function (e) {
    if (shown && shown.inspector && e.target === shown.inspector.canvas) return;
    if (shown && shown.polaroid && shown.media.contains(e.target)) return;
    if (shown || opening) close();
  }, { passive: true });
})();
