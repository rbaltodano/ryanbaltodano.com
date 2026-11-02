// Real captures and HTML content are available without this enhancement.
(() => {
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  const panels = [...workspace.querySelectorAll('[data-project]')];

  // A sticky gallery maps normal page scrolling to horizontal travel on roomy screens.
  const gallery = workspace.querySelector('.exhibit-gallery');
  const navigation = workspace.querySelector('.exhibit-navigation');
  if (!gallery || !navigation || !panels.length) return;
  const previous = navigation.querySelector('[data-exhibit-prev]');
  const next = navigation.querySelector('[data-exhibit-next]');
  const position = navigation.querySelector('[data-exhibit-position]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const flow = workspace.querySelector('.exhibit-flow');
  const sticky = flow.querySelector('.exhibit-flow__sticky');
  let pinned = false;
  let distance = 0;
  let pending = false;
  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
  const origin = () => window.scrollY + flow.getBoundingClientRect().top - 64;
  function updateScroll() {
    pending = false;
    if (pinned) gallery.scrollLeft = clamp(window.scrollY - origin(), 0, distance);
    updateGallery();
  }
  function requestScroll() {
    if (!pending) { pending = true; requestAnimationFrame(updateScroll); }
  }
  function layout(preserve = false) {
    const wasPinned = pinned;
    const oldTop = sticky.getBoundingClientRect().top;
    const oldLeft = gallery.scrollLeft;
    flow.classList.add('is-pinned');
    const expanded = !!gallery.querySelector('.workspace__inspector[open], .more[open]');
    pinned = innerWidth > 960 && !reducedMotion.matches && !expanded && sticky.offsetHeight <= innerHeight - 64;
    flow.classList.toggle('is-pinned', pinned);
    distance = gallery.scrollWidth - gallery.clientWidth;
    flow.style.height = pinned ? `${sticky.offsetHeight + distance}px` : '';
    if (preserve && wasPinned !== pinned && oldTop < innerHeight && oldTop + sticky.offsetHeight > 64) {
      window.scrollTo({ top: pinned ? origin() + oldLeft : window.scrollY + sticky.getBoundingClientRect().top - oldTop, behavior: 'instant' });
    }
    updateScroll();
  }
  let active = 0;
  function updateGallery() {
    const left = gallery.getBoundingClientRect().left + parseFloat(getComputedStyle(gallery).paddingLeft);
    active = panels.reduce((nearest, panel, index) =>
      Math.abs(panel.getBoundingClientRect().left - left) < Math.abs(panels[nearest].getBoundingClientRect().left - left) ? index : nearest, 0);
    previous.disabled = active === 0;
    next.disabled = active === panels.length - 1;
    position.textContent = panels[active].querySelector('h3').textContent;
  }
  function showExhibit(index) {
    const panel = panels[Math.max(0, Math.min(index, panels.length - 1))];
    const inset = parseFloat(getComputedStyle(gallery).paddingLeft);
    const target = clamp(gallery.scrollLeft + panel.getBoundingClientRect().left - gallery.getBoundingClientRect().left - inset, 0, distance);
    if (pinned) window.scrollTo({ top: origin() + target, behavior: 'smooth' });
    else gallery.scrollTo({ left: target, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
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
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', () => layout());
  reducedMotion.addEventListener('change', () => layout(true));
  gallery.querySelectorAll('details').forEach(details => details.addEventListener('toggle', () => layout(true)));
  // Direct project links must address the vertical position that reveals the panel.
  function followHash() {
    const index = panels.findIndex(panel => `#${panel.id}` === location.hash);
    if (index >= 0) showExhibit(index);
  }
  document.querySelectorAll('a[href="#project-angrove"], a[href="#invectus"]').forEach(link => {
    link.addEventListener('click', event => {
      if (!pinned || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      history.pushState(null, '', link.hash);
      followHash();
    });
  });
  window.addEventListener('hashchange', followHash);
  gallery.addEventListener('focusin', event => {
    const index = panels.findIndex(panel => panel.contains(event.target));
    if (pinned && index >= 0 && index !== active) showExhibit(index);
  });
  navigation.hidden = false;
  layout();
  new ResizeObserver(() => layout()).observe(sticky);
  document.fonts.ready.then(() => { layout(); followHash(); });
})();
