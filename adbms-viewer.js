/* ============================================================
   ADBMS driver source viewer
   Loads real driver files live from the public Consolidated-Firmware
   repo via raw.githubusercontent.com (no token, CORS-enabled, no API
   rate limit), and renders them with highlight.js + line numbers.
   ============================================================ */
(() => {
  const REPO = "UBCFormulaElectric/Consolidated-Firmware";
  const REF = "master";
  const ROOT = "firmware/hexray/BMS/src/";
  const RAW = `https://raw.githubusercontent.com/${REPO}/${REF}/${ROOT}`;
  const BLOB = `https://github.com/${REPO}/blob/${REF}/${ROOT}`;

  const groups = [
    {
      label: "Entry points",
      files: [
        { path: "io/io_adbms.hpp", desc: "Public driver interface — chain dimensions, register buffers" },
        { path: "app/app_segments.hpp", desc: "Segment-layer interface — conversion timing, bus locks" },
      ],
    },
    {
      label: "io/adbms — chip driver",
      files: [
        { path: "io/adbms/io_adbms_internal.hpp", desc: "Command opcodes & PEC framing constants" },
        { path: "io/adbms/io_adbms_internal.cpp", desc: "isoSPI transactions + PEC (CRC-15) generation & check" },
        { path: "io/adbms/io_adbms_cells.cpp", desc: "Cell-voltage (C-ADC) conversion & readback" },
        { path: "io/adbms/io_adbms_aux.cpp", desc: "Auxiliary / thermistor (GPIO) acquisition" },
        { path: "io/adbms/io_adbms_configs.cpp", desc: "Config register A/B read & write" },
        { path: "io/adbms/io_adbms_utils.cpp", desc: "Register packing & shared helpers" },
      ],
    },
    {
      label: "app/segments — pack logic",
      files: [
        { path: "app/segments/app_segments_internal.hpp", desc: "Thresholds & thermistor (Steinhart) constants" },
        { path: "app/segments/app_segments_conversions.cpp", desc: "Sequences conversions, raw counts → volts/°C" },
        { path: "app/segments/app_segments_calculation.cpp", desc: "Open-wire validity & measurement math" },
        { path: "app/segments/app_segments_broadcast.cpp", desc: "Streams voltages, temps & health to CAN" },
        { path: "app/segments/app_segments_balancing.cpp", desc: "Passive cell balancing (discharge timers)" },
        { path: "app/segments/app_segments_alerts.cpp", desc: "OV / UV / over-temp warnings & faults" },
        { path: "app/segments/app_segments_health.cpp", desc: "Per-segment fault bitmap" },
        { path: "app/segments/app_segments_config.cpp", desc: "Builds & syncs ADBMS config registers" },
        { path: "app/segments/app_segments_shared.cpp", desc: "Mutex-guarded latest pack values" },
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

  const highlight = (text) => {
    const pre = document.createElement("pre");
    pre.className = "cv-pre";
    const code = document.createElement("code");
    code.className = "language-cpp";
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
    pathEl.textContent = ROOT + path;
    ghEl.href = BLOB + path;
    ghEl.hidden = false;

    if (cache.has(path)) {
      highlight(cache.get(path));
      return;
    }

    status("Fetching <code>" + basename(path) + "</code> from GitHub&hellip;");
    try {
      const res = await fetch(RAW + path, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      cache.set(path, text);
      if (active === path) highlight(text);
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
