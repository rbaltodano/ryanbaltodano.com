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

// Hand-drawn marks (underlines, margin notes) draw in once each is a little way up the screen.
(() => {
  const marks = document.querySelectorAll(".draw-in");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    marks.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-in");
    io.unobserve(entry.target);
  }), { rootMargin: "0px 0px -15% 0px" });
  marks.forEach((el) => io.observe(el));
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
