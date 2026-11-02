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
