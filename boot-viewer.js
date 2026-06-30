/* ============================================================
   BMS bootloader source viewer
   Loads the real CAN-bootloader files live from the public
   Consolidated-Firmware repo via raw.githubusercontent.com (no
   token, CORS-enabled, no API rate limit), and renders them with
   highlight.js + line numbers. Unlike the ADBMS viewer the
   bootloader source spans several directories, so each entry
   carries its full repo-relative path.
   ============================================================ */
(() => {
  const REPO = "UBCFormulaElectric/Consolidated-Firmware";
  const REF = "master";
  const RAW = `https://raw.githubusercontent.com/${REPO}/${REF}/`;
  const BLOB = `https://github.com/${REPO}/blob/${REF}/`;

  const groups = [
    {
      label: "Boot library — firmware/boot",
      files: [
        { path: "firmware/boot/bootloader.hpp", desc: "Interface + config base class — RAM-buffered flash programming" },
        { path: "firmware/boot/bootloader.cpp", desc: "Boot state machine — CRC32 verify, jump-to-app, CAN erase/program/verify" },
        { path: "firmware/boot/bootloader.h", desc: "CAN bootloader protocol — command message IDs" },
        { path: "firmware/boot/README.md", desc: "CAN bootloader overview" },
      ],
    },
    {
      label: "BMS target — firmware/hexray/BMS/boot",
      files: [
        { path: "firmware/hexray/BMS/boot/bootloader_BMS.cpp", desc: "BMS entry — FDCAN setup, FreeRTOS tasks, board config" },
        { path: "firmware/hexray/BMS/boot/bootloader_BMS.hpp", desc: "Board CAN high-bits (node ID)" },
        { path: "firmware/hexray/BMS/boot/cubemx/Src/main.c", desc: "CubeMX-generated startup → hands off to the bootloader" },
      ],
    },
    {
      label: "Partitioning & build — firmware/cmake",
      files: [
        { path: "firmware/cmake/bootlib.cmake", desc: "Boot-binary generation — partition linker scripts & shared sources" },
      ],
    },
    {
      label: "Host flashing tool — scripts/canup",
      files: [
        { path: "scripts/canup/bootloader.py", desc: "Host-side CAN bootloader protocol (python-can)" },
        { path: "scripts/canup/update.py", desc: "Multi-board CAN update driver" },
      ],
    },
  ];

  const viewer = document.getElementById("code-viewer");
  const tree = document.getElementById("cv-tree");
  const body = document.getElementById("cv-body");
  const pathEl = document.getElementById("cv-path");
  const ghEl = document.getElementById("cv-gh");
  const toggleBtn = document.getElementById("cv-toggle");
  const expandBtn = document.getElementById("cv-expand");
  if (!tree || !body) return;

  const cache = new Map();
  const buttons = new Map();
  let active = null;

  const basename = (p) => p.slice(p.lastIndexOf("/") + 1);

  // pick a highlight.js language class from the file extension
  const langFor = (p) => {
    const ext = p.slice(p.lastIndexOf(".") + 1).toLowerCase();
    if (ext === "py") return "language-python";
    if (ext === "cmake" || basename(p).toLowerCase() === "cmakelists.txt") return "language-cmake";
    if (ext === "md") return "language-markdown";
    if (ext === "h" || ext === "c") return "language-c";
    return "language-cpp"; // .hpp / .cpp / fallback
  };

  // ---- build the file tree ----
  groups.forEach((group) => {
    const label = document.createElement("span");
    label.className = "cv-group-label";
    label.textContent = group.label;
    tree.appendChild(label);

    group.files.forEach((file) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cv-file";
      btn.dataset.path = file.path;

      const name = document.createElement("span");
      name.className = "cv-fname";
      name.textContent = basename(file.path);

      const desc = document.createElement("span");
      desc.className = "cv-fdesc";
      desc.textContent = file.desc;

      btn.append(name, desc);
      btn.addEventListener("click", () => load(file.path));
      tree.appendChild(btn);
      buttons.set(file.path, btn);
    });
  });

  const highlight = (text, path) => {
    const pre = document.createElement("pre");
    pre.className = "cv-pre";
    const code = document.createElement("code");
    code.className = langFor(path);
    code.textContent = text;
    pre.appendChild(code);
    body.replaceChildren(pre);
    if (window.hljs) {
      try {
        window.hljs.highlightElement(code);
        if (window.hljs.lineNumbersBlock) window.hljs.lineNumbersBlock(code);
      } catch (_) {
        /* highlighting is best-effort */
      }
    }
  };

  const status = (msg, isError) => {
    const div = document.createElement("div");
    div.className = "cv-status" + (isError ? " cv-status--error" : "");
    div.innerHTML = msg;
    body.replaceChildren(div);
  };

  async function load(path) {
    active = path;
    buttons.forEach((b, p) => b.classList.toggle("active", p === path));
    pathEl.textContent = path;
    ghEl.href = BLOB + path;
    ghEl.hidden = false;

    if (cache.has(path)) {
      highlight(cache.get(path), path);
      return;
    }

    status("Fetching <code>" + basename(path) + "</code> from GitHub&hellip;");
    try {
      const res = await fetch(RAW + path, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      cache.set(path, text);
      if (active === path) highlight(text, path);
    } catch (err) {
      status(
        "Couldn&rsquo;t load this file (" +
          err.message +
          "). <a href='" +
          BLOB +
          path +
          "' target='_blank' rel='noopener'>Open it on GitHub &nearr;</a>",
        true
      );
    }
  }

  // ---- hide / show the file tree ----
  if (toggleBtn && viewer) {
    toggleBtn.addEventListener("click", () => {
      const hidden = viewer.classList.toggle("tree-hidden");
      toggleBtn.setAttribute("aria-pressed", String(hidden));
      toggleBtn.setAttribute("aria-label", hidden ? "Show file list" : "Hide file list");
    });
  }

  // ---- expand to full screen ----
  if (expandBtn && viewer) {
    const label = expandBtn.querySelector(".cv-expand-label");
    const setExpanded = (on) => {
      viewer.classList.toggle("cv-fullscreen", on);
      document.body.classList.toggle("cv-noscroll", on);
      expandBtn.setAttribute("aria-label", on ? "Exit full screen" : "Expand viewer to full screen");
      if (label) label.textContent = on ? "Exit" : "Expand";
    };
    expandBtn.addEventListener("click", () => setExpanded(!viewer.classList.contains("cv-fullscreen")));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && viewer.classList.contains("cv-fullscreen")) setExpanded(false);
    });
  }

  // open the first file by default
  load(groups[0].files[0].path);
})();
