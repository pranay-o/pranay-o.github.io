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

/* page:  write-up page on this site (or null)
   link:  GitHub URL (or null)
   image: thumbnail path (or "" for an empty slot)            */
const FE = "https://github.com/UBCFormulaElectric/Consolidated-Firmware";
const projects = [
  {
    title: "ADBMS Driver Development",
    stack: ["C++20", "STM32H7", "SPI (DMA)", "isoSPI", "FreeRTOS"],
    page: "adbms-driver.html",
    link: FE,
    image: "assets/adbms-segment-test.jpg",
  },
  {
    title: "Vehicle Bootloader",
    stack: ["C++20", "C", "STM32H7 / H5", "CAN FD", "FreeRTOS"],
    page: "bms-bootloader.html",
    link: FE,
    image: "",
  },
  {
    title: "Sensorless FOC ESC",
    stack: ["STM32G4", "DRV8302", "SVPWM", "Altium", "Simulink"],
    page: "foc-esc.html",
    link: "https://github.com/pranay-o/MotorSpeedController",
    image: "",
  },
  {
    title: "SkyWatch RF — Counter-Drone Detection",
    stack: ["RF Front End", "LTspice", "LoRa", "Rogers 4003C"],
    page: null,
    link: null,
    image: "",
  },
  {
    title: "DC Motor RPM Controller",
    stack: ["Discrete Logic", "Op-Amp PI", "R-2R DAC", "BJT"],
    page: "dc-motor-controller.html",
    link: null,
    image: "assets/dc-motor-controller.jpg",
  },
  {
    title: "BMS Current Sensor Calibration",
    stack: ["Python", "NumPy", "Chimera", "ADC"],
    page: "calibration.html",
    link: FE + "/blob/master/scripts/current_sensor/calibration.py",
    image: "",
  },
  {
    title: "Rear Sensor Module",
    stack: ["FreeRTOS", "CAN", "I²C", "IMU"],
    page: null,
    link: null,
    image: "",
  },
];
