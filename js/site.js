// Footer and title-page year
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// Films have an explicit pause control. Reduced motion starts paused, with manual play.
(() => {
  const films = document.querySelectorAll("video[data-play-in-view]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  films.forEach((film) => {
    film.controls = false; // Native controls remain available when JavaScript is disabled.
    const button = document.createElement("button");
    button.type = "button";
    button.className = "film__playback";
    button.setAttribute("aria-label", "Play or pause: " + film.getAttribute("aria-label"));
    const sync = () => { button.textContent = film.paused ? "Play video" : "Pause video"; };
    sync();
    film.addEventListener("play", sync);
    film.addEventListener("pause", sync);
    button.addEventListener("click", () => {
      film.dataset.pausedByUser = film.paused ? "false" : "true";
      if (film.paused) film.play().catch(sync);
      else film.pause();
    });
    film.closest("figure").querySelector("figcaption").append(button);
  });
  const pauseAll = () => films.forEach((film) => film.pause());
  reduce.addEventListener("change", () => { if (reduce.matches) pauseAll(); });
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
    const film = entry.target;
    if (entry.isIntersecting && !reduce.matches && film.dataset.pausedByUser !== "true") film.play().catch(() => {});
    else if (!entry.isIntersecting) film.pause();
  }), { threshold: 0.5 });
  films.forEach((film) => io.observe(film));
})();

// Headings gather like ink; figures settle, stamps press, and trails draw once.
(() => {
  const root = document.documentElement;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-ready")));
  const items = document.querySelectorAll("[data-ink], [data-settle], [data-stamp], .trail");
  if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-in")); return; }
  const reveal = (entries, observer) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-in");
    observer.unobserve(entry.target);
  });
  const io = new IntersectionObserver(reveal, { rootMargin: "0px 0px -12% 0px" });
  items.forEach((el) => io.observe(el));

})();

// The opening statement comes in a letter at a time once the opening is released (after the
// portrait's first move). Each letter is its own span with its place in --i; the heading keeps its
// aria-label, so it still reads as one line. While drafting, the letters wait as outlines and fill
// with ink in the same order.
(() => {
  const root = document.documentElement;
  const statement = document.querySelector(".hero .statement");
  if (!statement || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // The drafting crew owns the reveal on animated visits. Avoid a second,
  // independently timed letter animation racing the pen across the heading.
  if (root.classList.contains("is-drafting")) return;
  // Phones ink the heading as one piece instead of tracking a layer per letter.
  if (matchMedia("(max-width: 48rem), (pointer: coarse)").matches) return;
  let i = 0;
  const split = (node) => [...node.childNodes].forEach((child) => {
    if (child.nodeType === 1) return split(child);
    if (child.nodeType !== 3) return;
    const frag = document.createDocumentFragment();
    for (const ch of child.textContent) {
      if (/\s/.test(ch)) { frag.append(ch); continue; }
      const letter = document.createElement("span");
      letter.className = "letter";
      letter.style.setProperty("--i", i++);
      letter.textContent = ch;
      frag.append(letter);
    }
    child.replaceWith(frag);
  });
  split(statement);
  statement.classList.add("is-lettered");
  const spell = () => statement.classList.add("is-spelled");
  if (!root.classList.contains("is-awaiting-photo")) return requestAnimationFrame(spell);
  const watch = new MutationObserver(() => {
    if (root.classList.contains("is-awaiting-photo")) return;
    watch.disconnect();
    spell();
  });
  watch.observe(root, { attributes: true, attributeFilter: ["class"] });
  setTimeout(spell, 4500);
})();
