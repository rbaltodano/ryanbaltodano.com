// Real captures and HTML content are available without this enhancement.
(() => {
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  const panels = [...workspace.querySelectorAll('[data-project]')];

  panels.forEach(panel => {
    const markers = panel.querySelector('.workspace__markers');
    if (markers) markers.hidden = false;
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
      const selectedMarker = (markers || panel).querySelector(`[data-note="${panel.dataset.selectedNote}"]`);
      const focusInCopy = document.activeElement.closest('.workspace__note-copy');
      selectNote(panel.dataset.selectedNote);
      if (focusInCopy) selectedMarker.focus({ preventScroll: true });
    });
    selectNote('1');
  });

  workspace.classList.add('is-enhanced');

  // Native horizontal scrolling works with touch, trackpad, keyboard and direct links.
  const gallery = workspace.querySelector('.exhibit-gallery');
  const navigation = workspace.querySelector('.exhibit-navigation');
  if (!gallery || !navigation || !panels.length) return;
  const previous = navigation.querySelector('[data-exhibit-prev]');
  const next = navigation.querySelector('[data-exhibit-next]');
  const position = navigation.querySelector('[data-exhibit-position]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const numerals = ['I', 'II'];
  let active = 0;
  function updateGallery() {
    const left = gallery.getBoundingClientRect().left + parseFloat(getComputedStyle(gallery).paddingLeft);
    active = panels.reduce((nearest, panel, index) =>
      Math.abs(panel.getBoundingClientRect().left - left) < Math.abs(panels[nearest].getBoundingClientRect().left - left) ? index : nearest, 0);
    previous.disabled = active === 0;
    next.disabled = active === panels.length - 1;
    position.textContent = `${numerals[active] || active + 1} / ${numerals[panels.length - 1] || panels.length}`;
  }
  function showExhibit(index) {
    const panel = panels[Math.max(0, Math.min(index, panels.length - 1))];
    const inset = parseFloat(getComputedStyle(gallery).paddingLeft);
    gallery.scrollTo({
      left: gallery.scrollLeft + panel.getBoundingClientRect().left - gallery.getBoundingClientRect().left - inset,
      behavior: reducedMotion.matches ? 'instant' : 'smooth'
    });
  }
  previous.addEventListener('click', () => showExhibit(active - 1));
  next.addEventListener('click', () => showExhibit(active + 1));
  gallery.addEventListener('keydown', event => {
    if (event.target !== gallery) return;
    const indices = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: panels.length - 1 };
    if (!(event.key in indices)) return;
    event.preventDefault();
    showExhibit(indices[event.key]);
  });
  gallery.addEventListener('scroll', updateGallery, { passive: true });
  window.addEventListener('resize', updateGallery);
  navigation.hidden = false;
  updateGallery();
})();
