// "Design and web" is laid out like an Angrove Board: each item can be picked up and moved, snaps to
// an 8 pt grid as it does in WorktreeItemView, and sends one dot-grid ripple out when it is dropped.
// Below 900px the items stack in normal flow and nothing moves.
(function () {
  var board = document.querySelector('[data-board]');
  if (!board) return;
  var wide = window.matchMedia('(min-width: 901px)');
  var SNAP = 8;
  var top = 3;

  board.querySelectorAll('[data-board-item]').forEach(function (item) {
    var drag = null;
    item.addEventListener('pointerdown', function (e) {
      if (!wide.matches || e.button !== 0 || e.target.closest('a, button, video')) return;
      var b = board.getBoundingClientRect(), r = item.getBoundingClientRect();
      drag = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top, bw: b.width, bh: b.height, w: r.width, h: r.height, moved: false };
      item.setPointerCapture(e.pointerId);
      item.style.zIndex = String(++top);
      item.classList.add('is-lifted');
      e.preventDefault();
    });
    item.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var b = board.getBoundingClientRect();
      var x = Math.round((e.clientX - b.left - drag.dx) / SNAP) * SNAP;
      var y = Math.round((e.clientY - b.top - drag.dy) / SNAP) * SNAP;
      x = Math.max(0, Math.min(drag.bw - drag.w, x));
      y = Math.max(0, Math.min(drag.bh - drag.h, y));
      item.style.setProperty('--x', (x / drag.bw * 100).toFixed(2) + '%');
      item.style.setProperty('--y', (y / drag.bh * 100).toFixed(2) + '%');
      drag.moved = true;
    });
    function drop(e) {
      if (!drag || e.pointerId !== drag.id) return;
      item.classList.remove('is-lifted');
      if (drag.moved) board.dispatchEvent(new CustomEvent('dotfield:ripple', { detail: { x: e.clientX, y: e.clientY, strength: 1 } }));
      drag = null;
    }
    item.addEventListener('pointerup', drop);
    item.addEventListener('pointercancel', drop);
  });
})();
