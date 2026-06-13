/* Abdulrahman S. Al-Batati — portfolio content manifest.
   Images resolve to img/{w480|w960|w1600}/<slug>.webp (tools/build_images.py). */

export const IMG = (slug, w = "w960") => `img/${w}/${slug}.webp`;

export const PROFILE = {
  name: "Abdulrahman S. Al-Batati",
  role: "Robotics & Autonomous Intelligent Systems",
  tagline: "I build robots that fly, drive, and find their way — from the CAD seed to the first flight.",
  blurb:
    "Senior Research Assistant at Prince Sultan University's Robotics & IoT Lab, heading to a PhD at KFUPM. " +
    "Six years turning mechanical design, UAV autonomy, and reinforcement learning into machines that work in the real world — " +
    "drones, ground robots, and the perception kits that keep them located when GPS goes dark.",
  origin: "It started as a childhood dream of being an inventor — not an engineer. The machines just made it real.",
  location: "Riyadh → Khobar, Saudi Arabia",
  email: "asmalbatati@hotmail.com",
  links: {
    github: "https://github.com/asmbatati",
    linkedin: "https://www.linkedin.com/in/asmbatati",
    scholar: "https://scholar.google.com/citations?user=asmbatati",
  },
  languages: ["Arabic — native", "English — professional", "Chinese — HSK2"],
};

export const STATS = [
  { n: "10", label: "papers published" },
  { n: "2", label: "patents granted" },
  { n: "6+", label: "years in robotics" },
  { n: "8", label: "robots designed & built" },
];

/* ── Projects (sphere gallery) — each card has a verified render/photo ── */
export const PROJECTS = [
  { id: "proj-vtol-build", title: "VTOL UAV Platform", kind: "Flagship build", year: "2023",
    blurb: "A large hybrid VTOL fixed-wing — vertical take-off, fixed-wing cruise. Designed, fabricated, and flown in-house for long-endurance missions." },
  { id: "proj-taer", title: "TAER", kind: "VTOL · CAD", year: "2023",
    blurb: "Long-endurance tilt-tail VTOL concept: folding quad-lift arms over an efficient fixed-wing cruise body. Full SolidWorks design." },
  { id: "proj-roboeye", title: "RoboEye", kind: "VIO sensor kit · patent", year: "2024",
    blurb: "A compact visual-inertial localization kit (stereo + IMU on Raspberry Pi / Jetson) that keeps robots located in GPS-denied spaces. Patent-pending." },
  { id: "proj-amir", title: "AMIR", kind: "Warehouse AGV · patent", year: "2022",
    blurb: "Autonomous mobile robot for warehouse logistics — low-profile tote-carrier with onboard navigation. Granted industrial-design patent." },
  { id: "proj-robohotel", title: "RoboHotel", kind: "Service robot · patent", year: "2022",
    blurb: "A bellhop service robot for hotels: luggage-carrying AMR with a guest touchscreen and a hospitality-grade shell." },
  { id: "proj-faseeh", title: "FASEEH", kind: "Outdoor UGV", year: "2023",
    blurb: "Rugged Ackermann-steered ground vehicle with long-travel suspension for outdoor autonomy on uneven terrain." },
  { id: "proj-agridrone", title: "AgriDrone", kind: "Spraying hexacopter", year: "2023",
    blurb: "A heavy-lift agricultural hexacopter for precision spraying and palm-tree survey, designed around a carbon-fiber payload bay." },
  { id: "proj-surveil", title: "Surveillance Drone", kind: "Custom hexacopter", year: "2022",
    blurb: "A custom hexacopter with a stabilized gimbal payload for aerial inspection and tracking research." },
];

/* ── Research timeline (P7 glowing path) — published milestones ── */
export const PAPERS = [
  { year: "2026", title: "ROS 2 in a Nutshell: A Survey", venue: "ACM Computing Surveys", role: "First author",
    doi: "https://doi.org/10.1145/3815113", tag: "ROS 2" },
  { year: "2026", title: "Two-Stage Residual EKF with XGBoost & KAN for GNSS-denied UAV Localization", venue: "Engineering Applications of AI", role: "Co-author",
    doi: "https://doi.org/10.1016/j.engappai.2026.114430", tag: "Localization" },
  { year: "2025", title: "GNSS-Denied UAV Navigation: Complexity, Sensor Fusion & Localization", venue: "Satellite Navigation", role: "Co-author",
    doi: "https://doi.org/10.1186/s43020-025-00162-z", tag: "Localization" },
  { year: "2025", title: "Palm: A Culturally Inclusive Dataset for Arabic LLMs", venue: "ACL 2025 (Vienna)", role: "Contributor",
    doi: "https://doi.org/10.18653/v1/2025.acl-long.1579", tag: "Arabic NLP" },
  { year: "2025", title: "VECTOR: Velocity-Enhanced GRU for Real-Time 3D UAV Trajectory Prediction", venue: "Drones (MDPI)", role: "Co-author",
    doi: "https://doi.org/10.3390/drones9010008", tag: "Prediction" },
  { year: "2025", title: "FLIGHTGEN: ROS 2-Powered Automated UAV Dataset Generator", venue: "SmartSE (Springer)", role: "Co-author",
    doi: "https://doi.org/10.1007/978-3-031-91235-1_28", tag: "Simulation" },
  { year: "2024", title: "D2DTracker: Real-Time Trajectory Prediction for Drone-to-Drone Tracking", venue: "UVS 2024 (IEEE)", role: "Co-author",
    doi: "https://doi.org/10.1109/UVS59630.2024.10467173", tag: "Tracking" },
];

export const RESEARCH_SUMMARY = {
  published: 10, accepted: 4, review: 3, contributed: 5,
  note: "10 published (8 peer-reviewed + 2 preprints) · 4 accepted (incl. 3 Springer chapters) · 3 under review · 5 uncredited framework contributions.",
};

/* ── Galleries ── */
export const ROBOTS = [
  { id: "proj-vtol-build", cap: "VTOL UAV — final assembly in the lab" },
  { id: "rob-psu-hexa",    cap: "PSU Robotics & IoT Lab hexacopter — exhibition build" },
  { id: "rob-quad-gym",    cap: "Research quadrotor — flight-test platform" },
  { id: "rob-ugv-proto",   cap: "Indoor differential-drive UGV — early prototype" },
  { id: "rob-gimbal",      cap: "Stabilized GoPro gimbal payload" },
  { id: "rob-quad-elec",   cap: "Custom flight-controller stack — wiring detail" },
  { id: "rob-bench",       cap: "The workshop bench — fixed-wing fleet in progress" },
  { id: "proj-surveil",    cap: "Custom surveillance hexacopter — studio" },
];

export const PRINTS = [
  { id: "print-stereo",  cap: "RoboEye stereo-camera enclosure — 125 g, printed in PETG" },
  { id: "print-kacst-1", cap: "Functional prints — impeller, housing, mechanisms (KACST Industry 4.0)" },
  { id: "print-kacst-2", cap: "Engine piston, turbine & centrifugal housing — printed for testing" },
  { id: "patent-vtol",   cap: "1:7 VTOL prototype — the patented industrial design" },
];

export const PATENTS = [
  { id: "patent-transfer", title: "Transfer Robots (AMIR)", body: "Granted industrial-design certificate — Saudi Authority for Intellectual Property. Autonomous transfer robots for warehouses & hotels.", year: "2023" },
  { id: "patent-vtol", title: "VTOL Aircraft", body: "Granted industrial-design certificate — a hybrid vertical-take-off / fixed-wing UAV. Prince Sultan University.", year: "2023" },
];

export const EXPERIENCE = [
  { when: "2022 — now", role: "Senior Research Assistant", org: "Prince Sultan University · Robotics & IoT Lab (RIOTU)",
    note: "Lead robotics R&D — UAV/UGV design, GPS-denied localization (PSDSARC defense collaboration), agentic-AI multi-robot systems, generative 3D for manufacturing. Teach CS460 Mobile Robots; run drone & ROS 2 workshops." },
  { when: "2019 — 2021", role: "Aircraft Maintenance Engineer", org: "Saudia Aerospace Engineering Industries (SAEI), Jeddah",
    note: "Recovered SAR 21M in lost invoices; cut analysis time 96% with KPI dashboards; led a defect-reduction project (−70% NEF defects)." },
  { when: "2017", role: "Production Engineering Trainee", org: "KACST Innovative Centre for Industry 4.0",
    note: "PLC processes, CAD/CAM/CAE with NX11, CNC machining." },
];

export const EDUCATION = [
  { when: "2018 — 2021", deg: "M.Sc. Robotics & Autonomous Intelligent Systems", org: "KFUPM · Dhahran", extra: "GPA 3.6 / 4.0 · with honors" },
  { when: "2014 — 2018", deg: "B.Sc. Mechanical Engineering", org: "KFUPM · Dhahran", extra: "GPA 3.5 / 4.0 · with honors" },
  { when: "2016", deg: "Exchange — Mechanical Engineering", org: "Colorado School of Mines · USA", extra: "" },
];

export const SKILLS = [
  { group: "Robotics", items: ["ROS 2 / middleware", "URDF · Gazebo · PX4", "Autonomous UAV / UGV", "Multi-robot & MARL"] },
  { group: "AI / ML", items: ["Reinforcement learning", "Trajectory prediction (GRU)", "Agentic AI", "GPS-denied navigation"] },
  { group: "Engineering", items: ["SolidWorks · NX11 CAD", "3D printing & rapid prototyping", "Generative design", "Mechanical / vibration"] },
  { group: "Code", items: ["Python", "C++", "Docker · Git", "Simulation pipelines"] },
];

export const REPOS = [
  { name: "uavros2_docker", lang: "Shell", stars: 4, desc: "Dockerized ROS 2 stack for UAV development.", url: "https://github.com/asmbatati/uavros2_docker" },
  { name: "uavros2", lang: "Python", stars: 3, desc: "ROS 2 packages for UAV autonomy.", url: "https://github.com/asmbatati/uavros2" },
  { name: "ros2_mavros", lang: "Python", stars: 3, desc: "ROS 2 Humble offboard UAV control via MAVROS.", url: "https://github.com/asmbatati/ros2_mavros" },
  { name: "awesome-ros", lang: "Python", stars: 1, desc: "Community dataset of the ROS ecosystem.", url: "https://github.com/asmbatati/awesome-ros" },
  { name: "d2dtracker_interception", lang: "Python", stars: 1, desc: "Drone-to-drone trajectory interception in ROS 2.", url: "https://github.com/asmbatati/d2dtracker_interception" },
  { name: "cad_2_mesh", lang: "Python", stars: 0, desc: "CAD → mesh conversion for simulation pipelines.", url: "https://github.com/asmbatati/cad_2_mesh" },
];
