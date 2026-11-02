// Real captures and HTML content are available without this enhancement.
(() => {
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  const panels = [...workspace.querySelectorAll('[data-project]')];

  panels.forEach(panel => {
    const markers = panel.querySelector('.workspace__markers');
    markers.hidden = false;
    const controls = [...panel.querySelectorAll('[data-note]')];
    function selectNote(number) {
      const current = panel.dataset.selectedNote;
      const selected = current === number ? '' : number;
      panel.dataset.selectedNote = selected;
      controls.forEach(control => {
        const active = control.dataset.note === selected;
        control.classList.toggle('is-selected', active);
        control.setAttribute(control.classList.contains('workspace__marker') ? 'aria-pressed' : 'aria-expanded', String(active));
      });
      panel.querySelectorAll('.workspace__note-copy').forEach(copy => {
        copy.hidden = copy.id !== `note-${panel.dataset.project}-${selected}`;
      });
    }
    controls.forEach(control => {
      control.disabled = false;
      control.addEventListener('click', () => selectNote(control.dataset.note));
    });
    panel.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !panel.dataset.selectedNote) return;
      const selectedMarker = markers.querySelector(`[data-note="${panel.dataset.selectedNote}"]`);
      const focusInCopy = document.activeElement.closest('.workspace__note-copy');
      selectNote(panel.dataset.selectedNote);
      if (focusInCopy) selectedMarker.focus({ preventScroll: true });
    });
    selectNote('1');
  });

  workspace.classList.add('is-enhanced');
})();
