// Real captures and HTML content are available without this enhancement.
(() => {
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  const tabs = [...workspace.querySelectorAll('[data-project-tab]')];
  const panels = [...workspace.querySelectorAll('[data-project]')];
  const tablist = workspace.querySelector('.workspace__tabs');
  tablist.setAttribute('role', 'tablist');
  tabs.forEach(tab => {
    const panel = panels.find(panel => panel.dataset.project === tab.dataset.projectTab);
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
  });

  function activate(key, { focus = false, updateHash = false } = {}) {
    const selected = panels.find(panel => panel.dataset.project === key);
    if (!selected) return;
    // Close supporting screens so switching projects never leaves a large empty slot.
    workspace.querySelectorAll('details[open]').forEach(details => { details.open = false; });
    panels.forEach(panel => { panel.hidden = panel !== selected; });
    tabs.forEach(tab => {
      const active = tab.dataset.projectTab === key;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus({ preventScroll: true });
    });
    if (updateHash) history.replaceState(null, '', `#${selected.id}`);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', event => {
      // Keep normal browser behavior for modified clicks and new-tab actions.
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      activate(tab.dataset.projectTab, { updateHash: true });
    });
    tab.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault();
      activate(tabs[next].dataset.projectTab, { focus: true, updateHash: true });
    });
  });

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

  const fromHash = () => {
    const panel = panels.find(panel => `#${panel.id}` === location.hash);
    if (panel) activate(panel.dataset.project);
  };
  activate('angrove');
  fromHash();
  addEventListener('hashchange', fromHash);
  workspace.classList.add('is-enhanced');
})();
