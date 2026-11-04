// Footer and title-page year
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// Day (ivory plate) and night (reading room). The head script applies the saved choice before first paint.
(() => {
  const root = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!toggle) return;
  const render = () => {
    const night = root.dataset.theme === "night";
    toggle.setAttribute("aria-pressed", String(night));
    meta.content = night ? "#151311" : "#ece5d6";
  };
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "night" ? "day" : "night";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    render();
  });
  render();
})();

// Product films loop while on screen and pause off it. With reduced motion they rest on their poster.
(() => {
  const films = document.querySelectorAll("video[data-play-in-view]");
  if (!films.length || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.play().catch(() => {});
    else entry.target.pause();
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
