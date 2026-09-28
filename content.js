/* ============================================================
   Site content — everything the Experience / Projects / Resume
   pages say lives in this file. Edit here; site.js renders it.

   Paths (images, write-up pages, resume) are relative to the
   site root; site.js fixes them up for pages in subfolders.
   ============================================================ */

const site = {
  name: "Pranay Oza",
  links: {
    linkedin: "https://www.linkedin.com/in/pranayoza/",
    github: "https://github.com/pranay-o",
    email: "mailto:oza.pranay06@gmail.com",
    resume: "assets/Resume_Pranay.pdf",
  },
  // Page image shown on the Resume tab. Edit assets/Resume_Pranay.tex, then run
  // scripts/build-resume.sh to rebuild both the PDF and this image.
  resumePreview: "assets/Resume_Pranay.svg",
};

/* Intro paragraphs, shown on the Resume tab above the resume links.
   Each paragraph is a list of pieces:
     "plain string"              → body text (muted)
     { text: "..." }             → emphasized, text colour
     { accent: "..." }           → emphasized, accent blue
     { accent: "...", href: "" } → accent-blue link            */
const intro = [
  [
    "Computer Engineering at the ",
    { text: "University of British Columbia" },
    ". Interested in ",
    { accent: "safety-critical, high-voltage firmware" },
    " and bare-metal embedded systems.",
  ],
  [
    "Looking for embedded systems or firmware internships starting ",
    { text: "September 2027" },
    ". If you’re hiring, reach me at ",
    { accent: "oza.pranay06@gmail.com", href: "mailto:oza.pranay06@gmail.com" },
    ".",
  ],
];

/* One short bullet per entry; leave points empty for none.
   Listed by start date, newest first.                         */
const experience = [
  {
    role: "High Voltage Firmware Integration",
    company: "Tesla",
    dates: "Incoming May 2027",
    points: [],
  },
  {
    role: "Battery Management System Firmware Lead",
    company: "UBC Formula Electric",
    dates: "Jun 2026 — Present",
    points: [
      "Lead firmware for the car’s custom 600 V battery management system, from battery modelling and state estimation down to the drivers that monitor 500+ lithium-ion cells.",
    ],
  },
  {
    role: "Hardware Operations Intern",
    company: "Hypercharge Networks",
    dates: "Jan 2026 — May 2026",
    points: [
      "Diagnosed OCPP, WebSocket, and firmware faults on Level 2 EV chargers, and built a React Native provisioning app that made deployment 3× faster.",
    ],
  },
  {
    role: "Battery Management System Firmware",
    company: "UBC Formula Electric",
    dates: "Sep 2025 — Jun 2026",
    points: [
      "Developed core battery-monitoring firmware, including the ADBMS6830B cell-monitoring driver, and handled bring-up and validation on the custom BMS boards.",
    ],
  },
  {
    role: "Low Voltage Firmware",
    company: "UBC Formula Electric",
    dates: "Sep 2024 — Sep 2025",
    points: [
      "Built FreeRTOS firmware for the Rear Sensor Module, which handles braking, cooling, and vehicle telemetry over FDCAN.",
    ],
  },
];

/* summary: one line on what it is, with the key terms
   page:    write-up page on this site (or null)
   link:    GitHub URL (or null)
   image:   optional photo shown above the title (leave out for none) */
const FE = "https://github.com/UBCFormulaElectric/Consolidated-Firmware";
const projects = [
  {
    title: "ADBMS Driver Development",
    summary: "Driver for daisy-chained ADBMS6830B cell monitors over isoSPI: PEC-checked frames, cell-voltage and thermistor sensing, open-wire detection and cell balancing, on FreeRTOS with DMA SPI.",
    page: "adbms-driver.html",
    link: FE,
    image: "assets/adbms-segment-test.jpg",
  },
  {
    title: "Vehicle Bootloader",
    summary: "FDCAN bootloader with CRC32-verified boot and flash partitioning, so every board on the car can be reflashed over the bus without a debugger.",
    page: "bms-bootloader.html",
    link: FE,
  },
  {
    title: "Multiplexed FDCAN Code Generation",
    summary: "Rust tooling that generates FDCAN message code from a single JSON definition, now adding signal multiplexing to pack more telemetry into each frame without extra bus load.",
    page: null,
    link: null,
  },
  {
    title: "ISRs in Tightly-Coupled Memory",
    summary: "Relocating ISRs and the interrupt vector table into the STM32H7's tightly-coupled memory (ITCM) for low-latency, deterministic interrupt response.",
    page: null,
    link: null,
  },
  {
    title: "State-of-Charge Estimation",
    summary: "Second-order RC equivalent-circuit battery model in MATLAB, fitted from HPPC, OCV–SOC and capacity tests, as the base for the BMS state-of-charge algorithm.",
    page: null,
    link: null,
  },
  {
    title: "Sensorless FOC ESC",
    summary: "Custom 4-layer STM32G4 ESC for 12 V / 30 A BLDC motors, running sensorless field-oriented control with back-EMF zero-cross detection and SVPWM, validated in Simulink.",
    page: "foc-esc.html",
    link: "https://github.com/pranay-o/MotorSpeedController",
  },
  {
    title: "RF Drone Detection",
    summary: "Passive 2.4 / 5.8 GHz drone detector with an all-analog RF front end (LNA, bandpass filters, log detector) that raises alerts over a 915 MHz LoRa link.",
    page: null,
    link: null,
  },
  {
    title: "DC Motor RPM Controller",
    summary: "Closed-loop speed controller built from discrete logic: optical encoder, counter and R-2R DAC feedback into an op-amp PI controller driving a BJT motor stage.",
    page: "dc-motor-controller.html",
    link: null,
    image: "assets/dc-motor-controller.jpg",
  },
  {
    title: "BMS Current Sensor Calibration",
    summary: "Python tool that reads the 400 A and 50 A current-sensor ADCs live over Chimera and fits linear ADC-to-amps coefficients with NumPy for the BMS firmware.",
    page: "calibration.html",
    link: FE + "/blob/master/scripts/current_sensor/calibration.py",
  },
  {
    title: "Rear Sensor Module",
    summary: "FreeRTOS firmware for the car's rear sensor board: brake pressure and lights, cooling fans and coolant valves, an I²C flowmeter and IMU data, all reported over FDCAN.",
    page: null,
    link: null,
  },
];
