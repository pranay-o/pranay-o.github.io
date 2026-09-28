/* ============================================================
   Renders the shared header on every page, and the Experience /
   Projects / Resume content from content.js.

   Each page sets on <body>:
     data-page  experience | projects | resume | writeup
     data-root  path back to the site root ("" or "../")
   ============================================================ */
(() => {
  const root = document.body.dataset.root || "";
  const page = document.body.dataset.page;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const url = (p) => (/^(https?:|mailto:)/.test(p) ? p : root + p);

  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") node.className = v;
      else node.setAttribute(k, v === true ? "" : v);
    }
    node.append(...children.filter((c) => c !== null && c !== undefined));
    return node;
  };

  // Outline icons (Lucide, ISC licence). Static strings, safe for innerHTML.
  const ICONS = {
    linkedin:
      '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
    github:
      '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    email:
      '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    download:
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  };

  // Icon link whose label slides out on hover/focus. The label is always the
  // link's accessible name, even while collapsed.
  const iconLink = (key, label, attrs) =>
    el(
      "a",
      { ...attrs, class: ["icon-link", attrs.class].filter(Boolean).join(" ") },
      el("span", { class: "icon-pill" }, el("span", { class: "icon-label" }, label), icon(key))
    );

  const icon = (name) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = ICONS[name];
    return svg;
  };

  /* ---------- header ---------- */
  const renderHeader = (mount) => {
    // Experience is the landing page (/), so the name is its h1.
    const nameTag = page === "experience" ? "h1" : "p";
    const name = el(nameTag, { class: "site-name" }, el("a", { href: root || "./" }, site.name));

    const socials = [
      ["linkedin", "LinkedIn", site.links.linkedin],
      ["github", "GitHub", site.links.github],
      ["email", "Email", site.links.email],
    ].map(([key, label, href]) => {
      const external = !href.startsWith("mailto:");
      return iconLink(key, label, {
        href: url(href),
        target: external ? "_blank" : null,
        rel: external ? "noopener" : null,
      });
    });

    const current = page === "writeup" ? "projects" : page;
    const tabs = [
      ["experience", "Experience", root || "./"],
      ["projects", "Projects", root + "projects/"],
      ["resume", "Resume", root + "resume/"],
    ].map(([key, label, href]) =>
      el(
        "a",
        {
          class: "tab",
          href,
          // a write-up sits under Projects: highlight it, but it isn't that page
          "aria-current": key === current ? (key === page ? "page" : "true") : null,
        },
        label,
        // the underline is its own element so the page transition can slide it between tabs
        key === current ? el("span", { class: "tab-indicator", "aria-hidden": "true" }) : null
      )
    );

    mount.replaceChildren(
      el("div", { class: "header-top" }, name, el("div", { class: "socials" }, ...socials)),
      el("nav", { class: "tabs", "aria-label": "Primary" }, ...tabs)
    );
  };

  /* ---------- resume: intro + the resume page itself ---------- */
  const renderResume = (mount) => {
    const piece = (p) => {
      if (typeof p === "string") return p;
      if (p.href) return el("a", { href: url(p.href) }, p.accent);
      if (p.accent) return el("span", { class: "em-accent" }, p.accent);
      return el("span", { class: "em" }, p.text);
    };
    // The page opens the full PDF (zoomable on phones); the corner icon downloads it.
    const doc = el(
      "figure",
      { class: "resume-doc" },
      el(
        "a",
        { class: "resume-page", href: url(site.links.resume), target: "_blank", rel: "noopener" },
        el("img", { src: url(site.resumePreview), alt: `${site.name} — resume`, width: "612", height: "792" })
      ),
      iconLink("download", "Download", {
        class: "resume-download",
        href: url(site.links.resume),
        download: "Pranay_Oza_Resume.pdf",
      })
    );
    mount.replaceChildren(...intro.map((para) => el("p", {}, ...para.map(piece))), doc);
  };

  /* ---------- experience ---------- */
  const renderExperience = (mount) => {
    const items = experience.map((job) =>
      el(
        "li",
        { class: "job" },
        el("h2", { class: "job-role" }, job.role),
        el("p", { class: "job-company" }, job.company),
        el("p", { class: "job-dates" }, job.dates),
        job.points.length ? el("ul", { class: "job-points" }, ...job.points.map((pt) => el("li", {}, pt))) : null
      )
    );
    mount.replaceChildren(el("ul", { class: "jobs" }, ...items));
  };

  /* ---------- projects ---------- */
  const renderProjects = (mount) => {
    const items = projects.map((p) => {
      // The whole row opens the write-up (it highlights on hover): the title link stretches over it.
      // The GitHub icon sits above that link so it stays separately clickable.
      const title = el(
        "h2",
        { class: "project-title" },
        p.page ? el("a", { class: "project-link", href: url(p.page) }, p.title) : p.title
      );
      const github = p.link
        ? iconLink("github", "GitHub", {
            class: "project-github",
            href: p.link,
            target: "_blank",
            rel: "noopener",
            "aria-label": `${p.title} on GitHub`,
          })
        : null;

      return el(
        "li",
        { class: p.page ? "project project--link" : "project" },
        el(
          "div",
          { class: "project-body" },
          p.image ? el("img", { class: "project-img", src: url(p.image), alt: "", loading: "lazy" }) : null,
          el("div", { class: "project-head" }, title, github),
          el("p", { class: "project-summary" }, p.summary)
        )
      );
    });
    mount.replaceChildren(el("ul", { class: "projects" }, ...items));
  };

  const header = document.getElementById("site-header");
  if (header) renderHeader(header);

  const main = document.getElementById("content");
  if (main) {
    if (page === "experience") renderExperience(main);
    else if (page === "projects") renderProjects(main);
    else if (page === "resume") renderResume(main);
  }

  /* ---------- tab-switch animation ----------
     Browsers with cross-document view transitions animate the navigation
     from CSS (@view-transition). Tag it forward/backward from the tab order
     so the content slides the way you moved. Others fade the content in.   */
  const TAB_ORDER = ["experience", "projects", "writeup", "resume"];
  let prevTab = -1;
  try {
    prevTab = TAB_ORDER.indexOf(sessionStorage.getItem("tab"));
    sessionStorage.setItem("tab", page);
  } catch (_) {
    /* storage blocked: every switch animates forward */
  }
  if ("onpagereveal" in window) {
    window.addEventListener("pagereveal", (e) => {
      if (!e.viewTransition) return;
      e.viewTransition.types.add(prevTab > TAB_ORDER.indexOf(page) ? "backward" : "forward");
    });
  } else if (main) {
    main.classList.add("page-enter");
  }

  // Write-ups: keep 3D models and the bench video still for reduced-motion users.
  if (reduceMotion) {
    document.querySelectorAll("model-viewer[auto-rotate]").forEach((m) => m.removeAttribute("auto-rotate"));
    document.querySelectorAll("video[autoplay]").forEach((v) => {
      v.removeAttribute("autoplay");
      v.pause();
    });
  }
})();
