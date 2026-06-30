(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- reveal-on-scroll ---- */
  const animatedEls = document.querySelectorAll("[data-animate]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    animatedEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    animatedEls.forEach((el) => io.observe(el));
  }

  /* ---- mobile sidebar toggle ---- */
  const toggle = document.querySelector(".menu-toggle");
  const sideNav = document.getElementById("side-nav");
  if (toggle && sideNav) {
    toggle.addEventListener("click", () => {
      const open = sideNav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    sideNav.addEventListener("click", (e) => {
      if (e.target.tagName === "A" && window.innerWidth <= 860) {
        sideNav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- scroll-spy: highlight the sidebar link for the section in view ---- */
  if (sideNav && "IntersectionObserver" in window) {
    const links = Array.from(sideNav.querySelectorAll('a[href^="#"]'));
    const byId = new Map();
    const targets = [];
    links.forEach((link) => {
      const id = link.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      if (el) {
        byId.set(id, link);
        targets.push(el);
      }
    });

    if (targets.length) {
      const visible = new Set();
      const setActive = (id) => {
        links.forEach((l) => l.classList.remove("active"));
        const link = byId.get(id);
        if (link) link.classList.add("active");
      };

      const spy = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
          }
          // pick the first target (in document order) currently visible
          const current = targets.find((t) => visible.has(t.id));
          if (current) setActive(current.id);
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      targets.forEach((t) => spy.observe(t));
    }
  }
})();
