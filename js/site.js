// Footer year
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// Draw-in: line drawings trace stroke by stroke, and the footer name rises in, once each scrolls into view.
const reveal = document.querySelectorAll(".draw, .footer__wordmark");
document.querySelectorAll(".draw").forEach((svg) => svg.querySelectorAll("path").forEach((path, i) => path.style.setProperty("--i", i)));
if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
  reveal.forEach((el) => el.classList.add("is-in"));
} else {
  const watch = (els, rootMargin) => {
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    }), { rootMargin });
    els.forEach((el) => io.observe(el));
  };
  // Drawings wait until they are a little way up the screen; the footer name sits at the page end, so any glimpse counts.
  watch(document.querySelectorAll(".draw"), "0px 0px -12% 0px");
  watch(document.querySelectorAll(".footer__wordmark"), "0px");
}
