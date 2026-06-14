/* Abdulrahman S. Al-Batati — portfolio content manifest (bilingual EN/AR).
   Images resolve to img/{w480|w960|w1600}/<slug>.webp (tools/build_images.py). */

export const IMG = (slug, w = "w960") => `img/${w}/${slug}.webp`;

export const PROFILE = {
  name: "Abdulrahman S. Al-Batati",
  name_ar: "عبدالرحمن صالح البطاطي",
  role: "Robotics & Autonomous Intelligent Systems",
  role_ar: "الروبوتات والأنظمة الذكية المستقلة",
  blurb:
    "Senior Research Assistant at Prince Sultan University's Robotics & IoT Lab, heading to a PhD at KFUPM. " +
    "Six years turning mechanical design, UAV autonomy, and reinforcement learning into machines that work in the real world — " +
    "drones, ground robots, and the perception kits that keep them located when GPS goes dark.",
  blurb_ar:
    "باحث أول في معمل الروبوتات وإنترنت الأشياء بجامعة الأمير سلطان، ومتوجّه إلى الدكتوراه في جامعة الملك فهد للبترول والمعادن. " +
    "ستّ سنوات في تحويل التصميم الميكانيكي واستقلالية الطائرات المسيّرة والتعلّم المعزّز إلى آلاتٍ تعمل في الواقع — " +
    "طائرات مسيّرة، وروبوتات أرضية، وحساسات تُبقيها متموضِعة حين ينقطع نظام تحديد المواقع.",
  origin: "It started as a childhood dream of being an inventor — not an engineer. The machines just made it real.",
  origin_ar: "بدأ الأمر حلمًا في الطفولة بأن أكون مُخترعًا — لا مهندسًا. والآلات هي ما جعلت الحلم حقيقة.",
  location: "Riyadh → Khobar, Saudi Arabia",
  location_ar: "الرياض ← الخبر، المملكة العربية السعودية",
  email: "asmalbatati@hotmail.com",
  links: {
    github: "https://github.com/asmbatati",
    linkedin: "https://www.linkedin.com/in/asmbatati",
    scholar: "https://scholar.google.com/citations?user=asmbatati",
  },
  languages: ["Arabic — native", "English — professional", "Chinese — HSK2"],
  languages_ar: ["العربية — اللغة الأم", "الإنجليزية — احترافية", "الصينية — HSK2"],
};

export const STATS = [
  { n: "10", label: "papers published", label_ar: "بحثًا منشورًا" },
  { n: "2", label: "patents granted", label_ar: "براءتا تصميم" },
  { n: "6+", label: "years in robotics", label_ar: "سنوات في الروبوتات" },
  { n: "8", label: "robots designed & built", label_ar: "روبوتات صُمّمت وبُنيت" },
];

export const PROJECTS = [
  { id: "proj-vtol-build", title: "VTOL UAV Platform", title_ar: "منصة طائرة VTOL", kind: "Flagship build", kind_ar: "أبرز الأعمال", year: "2023",
    blurb: "A large hybrid VTOL fixed-wing — vertical take-off, fixed-wing cruise. Designed, fabricated, and flown in-house for long-endurance missions.",
    blurb_ar: "طائرة هجينة كبيرة عمودية الإقلاع وثابتة الجناح — إقلاع عمودي وطيران انسيابي. صُمّمت وصُنّعت وطُيّرت داخليًا لمهامٍ طويلة المدى." },
  { id: "proj-taer", title: "TAER", title_ar: "طائر", kind: "VTOL · CAD", kind_ar: "تصميم VTOL", year: "2023",
    blurb: "Long-endurance tilt-tail VTOL concept: folding quad-lift arms over an efficient fixed-wing cruise body. Full SolidWorks design.",
    blurb_ar: "تصميم VTOL طويل المدى بأذرع رفع قابلة للطي فوق جسم ثابت الجناح عالي الكفاءة. تصميم كامل على SolidWorks." },
  { id: "proj-roboeye", title: "RoboEye", title_ar: "عين الروبوت", kind: "VIO sensor kit · patent", kind_ar: "حساس تموضع · براءة", year: "2024",
    blurb: "A compact visual-inertial localization kit (stereo + IMU on Raspberry Pi / Jetson) that keeps robots located in GPS-denied spaces. Patented industrial design.",
    blurb_ar: "حساس تموضع بصري-قصوري مُدمج (كاميرتان + وحدة قياس قصوري على Raspberry Pi / Jetson) يُبقي الروبوت متموضِعًا في الأماكن المحرومة من GPS. تصميم صناعي مُسجّل." },
  { id: "proj-amir", title: "AMIR", title_ar: "عامر", kind: "Warehouse AGV · patent", kind_ar: "روبوت مستودعات · براءة", year: "2022",
    blurb: "Autonomous mobile robot for warehouse logistics — low-profile tote-carrier with onboard navigation. Granted industrial-design patent.",
    blurb_ar: "روبوت متحرّك مستقل لخدمات المستودعات — حامل صناديق منخفض مع ملاحة ذاتية. حاصل على براءة تصميم صناعي." },
  { id: "proj-robohotel", title: "RoboHotel", title_ar: "روبو-هوتيل", kind: "Service robot · patent", kind_ar: "روبوت خدمة · براءة", year: "2022",
    blurb: "A bellhop service robot for hotels: luggage-carrying AMR with a guest touchscreen and a hospitality-grade shell.",
    blurb_ar: "روبوت خدمة للفنادق بدور الحمّال: روبوت متحرّك يحمل الأمتعة بشاشة لمس للنزلاء وهيكلٍ بمستوى الضيافة." },
  { id: "proj-faseeh", title: "FASEEH", title_ar: "فصيح", kind: "Outdoor UGV", kind_ar: "روبوت أرضي خارجي", year: "2023",
    blurb: "Rugged Ackermann-steered ground vehicle with long-travel suspension for outdoor autonomy on uneven terrain.",
    blurb_ar: "مركبة أرضية صلبة بتوجيه أكرمان وتعليق طويل المدى للاستقلالية الخارجية على التضاريس الوعرة." },
  { id: "proj-agridrone", title: "AgriDrone", title_ar: "درون زراعي", kind: "Spraying hexacopter", kind_ar: "سداسية رشّ", year: "2023",
    blurb: "A heavy-lift agricultural hexacopter for precision spraying and palm-tree survey, designed around a carbon-fiber payload bay.",
    blurb_ar: "طائرة سداسية ثقيلة الحمولة للرشّ الدقيق ومسح أشجار النخيل، مُصمّمة حول حجيرة حمولة من ألياف الكربون." },
  { id: "proj-surveil", title: "Surveillance Drone", title_ar: "درون مراقبة", kind: "Custom hexacopter", kind_ar: "سداسية مخصّصة", year: "2022",
    blurb: "A custom hexacopter with a stabilized gimbal payload for aerial inspection and tracking research.",
    blurb_ar: "طائرة سداسية مخصّصة بحمولة مثبّتة بالجيمبال للتفتيش الجوي وأبحاث التتبّع." },
];

export const PAPERS = [
  { year: "2026", title: "ROS 2 in a Nutshell: A Survey", venue: "ACM Computing Surveys", role: "First author", role_ar: "المؤلف الأول",
    doi: "https://doi.org/10.1145/3815113", tag: "ROS 2" },
  { year: "2026", title: "Two-Stage Residual EKF with XGBoost & KAN for GNSS-denied UAV Localization", venue: "Engineering Applications of AI", role: "Co-author", role_ar: "مؤلف مشارك",
    doi: "https://doi.org/10.1016/j.engappai.2026.114430", tag: "Localization" },
  { year: "2025", title: "GNSS-Denied UAV Navigation: Complexity, Sensor Fusion & Localization", venue: "Satellite Navigation", role: "Co-author", role_ar: "مؤلف مشارك",
    doi: "https://doi.org/10.1186/s43020-025-00162-z", tag: "Localization" },
  { year: "2025", title: "Palm: A Culturally Inclusive Dataset for Arabic LLMs", venue: "ACL 2025 (Vienna)", role: "Contributor", role_ar: "مساهم",
    doi: "https://doi.org/10.18653/v1/2025.acl-long.1579", tag: "Arabic NLP" },
  { year: "2025", title: "VECTOR: Velocity-Enhanced GRU for Real-Time 3D UAV Trajectory Prediction", venue: "Drones (MDPI)", role: "Co-author", role_ar: "مؤلف مشارك",
    doi: "https://doi.org/10.3390/drones9010008", tag: "Prediction" },
  { year: "2025", title: "FLIGHTGEN: ROS 2-Powered Automated UAV Dataset Generator", venue: "SmartSE (Springer)", role: "Co-author", role_ar: "مؤلف مشارك",
    doi: "https://doi.org/10.1007/978-3-031-91235-1_28", tag: "Simulation" },
  { year: "2024", title: "D2DTracker: Real-Time Trajectory Prediction for Drone-to-Drone Tracking", venue: "UVS 2024 (IEEE)", role: "Co-author", role_ar: "مؤلف مشارك",
    doi: "https://doi.org/10.1109/UVS59630.2024.10467173", tag: "Tracking" },
];

export const RESEARCH_NOTE = "10 published (8 peer-reviewed + 2 preprints) · 4 accepted (incl. 3 Springer chapters) · 3 under review · 5 uncredited framework contributions.";
export const RESEARCH_NOTE_AR = "١٠ منشورة (٨ محكّمة + بحثان قيد الطبع) · ٤ مقبولة (منها ٣ فصول كتب من Springer) · ٣ قيد المراجعة · ٥ مساهمات إطارية غير منسوبة.";

export const ROBOTS = [
  { id: "proj-vtol-build", cap: "VTOL UAV — final assembly in the lab", cap_ar: "طائرة VTOL — التجميع النهائي في المعمل" },
  { id: "rob-psu-hexa",    cap: "PSU Robotics & IoT Lab hexacopter — exhibition build", cap_ar: "سداسية معمل الروبوتات بجامعة الأمير سلطان — نسخة المعرض" },
  { id: "rob-quad-gym",    cap: "Research quadrotor — flight-test platform", cap_ar: "رباعية بحثية — منصة اختبار الطيران" },
  { id: "rob-ugv-proto",   cap: "Indoor differential-drive UGV — early prototype", cap_ar: "روبوت أرضي داخلي تفاضلي الدفع — نموذج أولي" },
  { id: "rob-gimbal",      cap: "Stabilized GoPro gimbal payload", cap_ar: "حمولة جيمبال مثبّتة لكاميرا GoPro" },
  { id: "rob-quad-elec",   cap: "Custom flight-controller stack — wiring detail", cap_ar: "منظومة تحكّم طيران مخصّصة — تفاصيل التوصيل" },
  { id: "rob-bench",       cap: "The workshop bench — fixed-wing fleet in progress", cap_ar: "طاولة الورشة — أسطول ثابت الجناح قيد البناء" },
  { id: "proj-surveil",    cap: "Custom surveillance hexacopter — studio", cap_ar: "سداسية مراقبة مخصّصة — استوديو" },
];

export const PRINTS = [
  { id: "print-stereo",  cap: "RoboEye stereo-camera enclosure — 125 g, printed in PETG", cap_ar: "حاوية كاميرا RoboEye الثنائية — ١٢٥ غرامًا، مطبوعة من PETG" },
  { id: "print-kacst-1", cap: "Functional prints — impeller, housing, mechanisms (KACST Industry 4.0)", cap_ar: "مطبوعات وظيفية — مروحة، حاوية، آليّات (كاكست للصناعة ٤٫٠)" },
  { id: "print-kacst-2", cap: "Engine piston, turbine & centrifugal housing — printed for testing", cap_ar: "مكبس محرّك وتوربين وحاوية طاردة مركزية — مطبوعة للاختبار" },
  { id: "patent-vtol",   cap: "1:7 VTOL prototype — scale model", cap_ar: "نموذج طائرة VTOL بمقياس ١:٧" },
];

export const PATENTS = [
  { id: "patent-transfer", title: "Transfer Robots (AMIR)", title_ar: "روبوتات النقل (عامر)",
    body: "Granted industrial-design certificate — Saudi Authority for Intellectual Property. Autonomous transfer robots for warehouses & hotels.",
    body_ar: "شهادة تصميم صناعي ممنوحة — الهيئة السعودية للملكية الفكرية. روبوتات نقل ذاتية للمستودعات والفنادق.", year: "2023" },
  { id: "print-stereo", title: "RoboEye — VIO Localization Kit", title_ar: "عين الروبوت — حساس التموضع البصري-القصوري",
    body: "Granted industrial-design certificate — Saudi Authority for Intellectual Property. A visual-inertial odometry kit for GPS-denied robot localization.",
    body_ar: "شهادة تصميم صناعي ممنوحة — الهيئة السعودية للملكية الفكرية. حساس قياس بصري-قصوري لتموضع الروبوت في الأماكن المحرومة من GPS.", year: "2024" },
];

export const EXPERIENCE = [
  { when: "2022 — now", when_ar: "٢٠٢٢ — الآن", role: "Senior Research Assistant", role_ar: "باحث أول", org: "Prince Sultan University · Robotics & IoT Lab (RIOTU)", org_ar: "جامعة الأمير سلطان · معمل الروبوتات وإنترنت الأشياء",
    note: "Lead robotics R&D — UAV/UGV design, GPS-denied localization (PSDSARC defense collaboration), agentic-AI multi-robot systems, generative 3D for manufacturing. Teach CS460 Mobile Robots; run drone & ROS 2 workshops.",
    note_ar: "قيادة البحث والتطوير في الروبوتات — تصميم طائرات وروبوتات أرضية، التموضع دون GPS (بالتعاون مع مركز الأمير سلطان للدراسات الدفاعية)، منظومات روبوتات متعددة بالذكاء الوكيل، التوليد ثلاثي الأبعاد للتصنيع. تدريس مقرر CS460 وإقامة ورش الدرون وROS 2." },
  { when: "2019 — 2021", when_ar: "٢٠١٩ — ٢٠٢١", role: "Aircraft Maintenance Engineer", role_ar: "مهندس صيانة طائرات", org: "Saudia Aerospace Engineering Industries (SAEI), Jeddah", org_ar: "الصناعات الهندسية الجوية السعودية (SAEI)، جدة",
    note: "Recovered SAR 21M in lost invoices; cut analysis time 96% with KPI dashboards; led a defect-reduction project (−70% NEF defects).",
    note_ar: "استرداد ٢١ مليون ريال من فواتير مفقودة؛ خفض زمن التحليل ٩٦٪ عبر لوحات مؤشرات؛ قيادة مشروع خفض العيوب بنسبة ٧٠٪." },
  { when: "2017", when_ar: "٢٠١٧", role: "Production Engineering Trainee", role_ar: "متدرّب هندسة إنتاج", org: "KACST Innovative Centre for Industry 4.0", org_ar: "مركز كاكست الابتكاري للصناعة ٤٫٠",
    note: "PLC processes, CAD/CAM/CAE with NX11, CNC machining.",
    note_ar: "عمليات PLC، وتصميم وتصنيع وتحليل CAD/CAM/CAE عبر NX11، وتشغيل CNC." },
];

export const EDUCATION = [
  { when: "2018 — 2021", when_ar: "٢٠١٨ — ٢٠٢١", deg: "M.Sc. Robotics & Autonomous Intelligent Systems", deg_ar: "ماجستير الروبوتات والأنظمة الذكية المستقلة", org: "KFUPM · Dhahran", org_ar: "جامعة الملك فهد للبترول والمعادن · الظهران", extra: "GPA 3.6 / 4.0 · with honors", extra_ar: "المعدّل ٣٫٦ / ٤ · مع مرتبة الشرف" },
  { when: "2014 — 2018", when_ar: "٢٠١٤ — ٢٠١٨", deg: "B.Sc. Mechanical Engineering", deg_ar: "بكالوريوس الهندسة الميكانيكية", org: "KFUPM · Dhahran", org_ar: "جامعة الملك فهد للبترول والمعادن · الظهران", extra: "GPA 3.5 / 4.0 · with honors", extra_ar: "المعدّل ٣٫٥ / ٤ · مع مرتبة الشرف" },
  { when: "2016", when_ar: "٢٠١٦", deg: "Exchange — Mechanical Engineering", deg_ar: "تبادل طلابي — الهندسة الميكانيكية", org: "Colorado School of Mines · USA", org_ar: "كلية كولورادو للمناجم · الولايات المتحدة", extra: "", extra_ar: "" },
];

export const SKILLS = [
  { group: "Robotics", group_ar: "الروبوتات", items: ["ROS 2 / middleware", "URDF · Gazebo · PX4", "Autonomous UAV / UGV", "Multi-robot & MARL"], items_ar: ["ROS 2 والوسطيات", "URDF · Gazebo · PX4", "طائرات وروبوتات أرضية مستقلة", "روبوتات متعددة و MARL"] },
  { group: "AI / ML", group_ar: "الذكاء الاصطناعي", items: ["Reinforcement learning", "Trajectory prediction (GRU)", "Agentic AI", "GPS-denied navigation"], items_ar: ["التعلّم المعزّز", "توقّع المسار (GRU)", "الذكاء الوكيل", "الملاحة دون GPS"] },
  { group: "Engineering", group_ar: "الهندسة", items: ["SolidWorks · NX11 CAD", "3D printing & prototyping", "Generative design", "Mechanical / vibration"], items_ar: ["تصميم SolidWorks · NX11", "الطباعة ثلاثية الأبعاد والنمذجة", "التصميم التوليدي", "الميكانيكا والاهتزازات"] },
  { group: "Code", group_ar: "البرمجة", items: ["Python", "C++", "Docker · Git", "Simulation pipelines"], items_ar: ["Python", "C++", "Docker · Git", "خطوط المحاكاة"] },
];

export const REPOS = [
  { name: "uavros2_docker", lang: "Shell", stars: 4, desc: "Dockerized ROS 2 stack for UAV development.", desc_ar: "حزمة ROS 2 مُحوّاة بـDocker لتطوير الطائرات.", url: "https://github.com/asmbatati/uavros2_docker" },
  { name: "uavros2", lang: "Python", stars: 3, desc: "ROS 2 packages for UAV autonomy.", desc_ar: "حزم ROS 2 لاستقلالية الطائرات.", url: "https://github.com/asmbatati/uavros2" },
  { name: "ros2_mavros", lang: "Python", stars: 3, desc: "ROS 2 Humble offboard UAV control via MAVROS.", desc_ar: "تحكّم خارجي بالطائرات عبر MAVROS على ROS 2 Humble.", url: "https://github.com/asmbatati/ros2_mavros" },
  { name: "awesome-ros", lang: "Python", stars: 1, desc: "Community dataset of the ROS ecosystem.", desc_ar: "مجموعة بيانات مجتمعية لمنظومة ROS.", url: "https://github.com/asmbatati/awesome-ros" },
  { name: "d2dtracker_interception", lang: "Python", stars: 1, desc: "Drone-to-drone trajectory interception in ROS 2.", desc_ar: "اعتراض مسار درون بدرون في ROS 2.", url: "https://github.com/asmbatati/d2dtracker_interception" },
  { name: "cad_2_mesh", lang: "Python", stars: 0, desc: "CAD → mesh conversion for simulation pipelines.", desc_ar: "تحويل CAD إلى مجسّمات لخطوط المحاكاة.", url: "https://github.com/asmbatati/cad_2_mesh" },
];

/* ── Research taxonomy + full publications database ── */
export const TAXONOMY = [
  { id: "all", en: "All", ar: "الكل" },
  { id: "robotics", en: "Robotics Systems", ar: "أنظمة الروبوتات" },
  { id: "localization", en: "Localization & SLAM", ar: "التموضع والخرائط" },
  { id: "prediction", en: "Trajectory Prediction", ar: "توقّع المسار" },
  { id: "ros2", en: "ROS 2 & Middleware", ar: "ROS 2 والوسطيات" },
  { id: "sim", en: "Simulation & Sim2Real", ar: "المحاكاة" },
  { id: "nlp", en: "Arabic NLP", ar: "معالجة العربية" },
  { id: "gen3d", en: "3D / Generative", ar: "التوليد ثلاثي الأبعاد" },
  { id: "agentic", en: "Agentic AI", ar: "الذكاء الوكيل" },
];

export const PUBS = [
  { title: "ROS 2 in a Nutshell: A Survey", year: 2026, venue: "ACM Computing Surveys", role: "First author", role_ar: "المؤلف الأول",
    status: "published", taxo: "ros2", tags: ["ROS 2", "middleware", "survey"], doi: "https://doi.org/10.1145/3815113",
    abstract: "A comprehensive survey of the ROS 2 ecosystem — architecture, DDS middleware, real-time, security, and tooling — distilling 8,500+ sources into a single reference for roboticists.",
    abstract_ar: "مسح شامل لمنظومة ROS 2 — المعمارية، وسطية DDS، الزمن الحقيقي، الأمان، والأدوات — يلخّص أكثر من ٨٥٠٠ مصدر في مرجع واحد." },
  { title: "Two-Stage Residual EKF with XGBoost & KAN for GNSS-denied UAV Localization", year: 2026, venue: "Engineering Applications of AI", role: "Co-author", role_ar: "مؤلف مشارك",
    status: "published", taxo: "localization", tags: ["EKF", "XGBoost", "KAN", "GNSS-denied"], doi: "https://doi.org/10.1016/j.engappai.2026.114430",
    abstract: "A terrain-aided UAV localizer that learns the EKF residual with extreme gradient boosting and Kolmogorov–Arnold networks, holding position when GPS is unavailable.",
    abstract_ar: "مُموضِع طائرات يتعلّم بقية مرشّح كالمان عبر XGBoost وشبكات كولموغوروف-أرنولد للحفاظ على الموقع عند غياب GPS." },
  { title: "GNSS-Denied UAV Navigation: Complexity, Sensor Fusion & Localization", year: 2025, venue: "Satellite Navigation", role: "Co-author", role_ar: "مؤلف مشارك",
    status: "published", taxo: "localization", tags: ["sensor fusion", "survey", "navigation"], doi: "https://doi.org/10.1186/s43020-025-00162-z",
    abstract: "Analyzes computational complexity, sensor-fusion strategies, and localization methodologies for UAV navigation without satellite positioning.",
    abstract_ar: "تحليل التعقيد الحسابي واستراتيجيات دمج الحساسات ومنهجيات التموضع لملاحة الطائرات دون أقمار صناعية." },
  { title: "VECTOR: Velocity-Enhanced GRU for Real-Time 3D UAV Trajectory Prediction", year: 2025, venue: "Drones (MDPI)", role: "Co-author", role_ar: "مؤلف مشارك",
    status: "published", taxo: "prediction", tags: ["GRU", "trajectory", "real-time"], doi: "https://doi.org/10.3390/drones9010008",
    abstract: "A velocity-enhanced GRU network predicting 3D UAV trajectories in real time for agile tracking and interception.",
    abstract_ar: "شبكة GRU مُعزّزة بالسرعة تتوقّع مسارات الطائرات ثلاثية الأبعاد آنيًا للتتبّع والاعتراض." },
  { title: "Palm: A Culturally Inclusive Dataset for Arabic LLMs", year: 2025, venue: "ACL 2025 (Vienna)", role: "Contributor", role_ar: "مساهم",
    status: "published", taxo: "nlp", tags: ["Arabic LLM", "dataset", "ACL"], doi: "https://doi.org/10.18653/v1/2025.acl-long.1579",
    abstract: "A culturally inclusive, linguistically diverse dataset spanning Arabic dialects for training and evaluating Arabic large language models.",
    abstract_ar: "مجموعة بيانات شاملة ثقافيًا ومتنوّعة لغويًا تغطي اللهجات العربية لتدريب وتقييم النماذج اللغوية الكبيرة." },
  { title: "Towards Inclusive Arabic LLMs: A Culturally Aligned Benchmark", year: 2025, venue: "LoResLM @ COLING", role: "Co-author", role_ar: "مؤلف مشارك",
    status: "published", taxo: "nlp", tags: ["benchmark", "evaluation", "Arabic"], doi: "https://aclanthology.org/2025.loreslm-1.27",
    abstract: "A culturally aligned benchmark for evaluating how well Arabic LLMs reflect regional knowledge and values.",
    abstract_ar: "معيار مُحاذٍ ثقافيًا لتقييم مدى تمثيل النماذج العربية للمعرفة والقيم الإقليمية." },
  { title: "FLIGHTGEN: ROS 2-Powered Automated UAV Dataset Generator", year: 2025, venue: "SmartSE (Springer)", role: "Co-author", role_ar: "مؤلف مشارك",
    status: "published", taxo: "sim", tags: ["ROS 2", "dataset", "simulation"], doi: "https://doi.org/10.1007/978-3-031-91235-1_28",
    abstract: "An automated, ROS 2-powered pipeline that generates labeled UAV flight datasets in simulation for training perception models.",
    abstract_ar: "خط أنابيب آلي بـROS 2 يولّد مجموعات بيانات طيران موسومة في المحاكاة لتدريب نماذج الإدراك." },
  { title: "D2DTracker: Real-Time Trajectory Prediction for Drone-to-Drone Tracking", year: 2024, venue: "UVS 2024 (IEEE)", role: "Co-author", role_ar: "مؤلف مشارك",
    status: "published", taxo: "prediction", tags: ["drone-to-drone", "adaptive", "tracking"], doi: "https://doi.org/10.1109/UVS59630.2024.10467173",
    abstract: "A framework enabling real-time drone-to-drone trajectory prediction via adaptive model selection for agile interception.",
    abstract_ar: "إطار يتيح توقّع مسار درون-بدرون آنيًا عبر اختيار نموذج متكيّف للاعتراض السريع." },
  { title: "Robotics Applications in Criminal Investigations (Proposal)", year: 2024, venue: "Preprints.org", role: "First author", role_ar: "المؤلف الأول",
    status: "published", taxo: "robotics", tags: ["preprint", "HRI", "proposal"], doi: "https://doi.org/10.20944/preprints202410.1231.v1",
    abstract: "A novel proposal exploring how robots could assist in suspect interrogation and structured human questioning.",
    abstract_ar: "مقترح مبتكر يستكشف كيف يمكن للروبوتات أن تساعد في استجواب المشتبه بهم والاستجواب البشري المنظّم." },
  { title: "Autonomous Robot for Road-Line Markings Inspection & Maintenance", year: 2024, venue: "Preprints.org", role: "First author", role_ar: "المؤلف الأول",
    status: "published", taxo: "robotics", tags: ["preprint", "UGV", "infrastructure"], doi: "https://doi.org/10.20944/preprints202410.1284.v1",
    abstract: "A ground-robot design for autonomous inspection and repainting of road-lane markings — the Line-Painter UGV.",
    abstract_ar: "تصميم روبوت أرضي للتفتيش الذاتي وإعادة طلاء خطوط الطرق — روبوت رسم الخطوط." },
  { title: "Toward Intelligent Quadruped Robots: A Survey of Vision-Language-Action", year: 2026, venue: "Survey · in progress", role: "Lead author", role_ar: "المؤلف الرئيس",
    status: "review", taxo: "robotics", tags: ["VLA", "quadruped", "survey"], doi: "",
    abstract: "A systematic survey of vision-language-action models for quadruped robots — perception, reasoning, and control toward general-purpose legged autonomy.",
    abstract_ar: "مسح منهجي لنماذج الرؤية-اللغة-الفعل للروبوتات الرباعية — الإدراك والاستدلال والتحكّم نحو استقلالية عامة." },
  { title: "Natural-Language Generative 3D for Precision Engineering Parts", year: 2026, venue: "in progress", role: "Lead author", role_ar: "المؤلف الرئيس",
    status: "review", taxo: "gen3d", tags: ["generative 3D", "manufacturing", "LLM"], doi: "",
    abstract: "Using natural language and generative models to design and 3D-print precise engineering components on demand.",
    abstract_ar: "استخدام اللغة الطبيعية والنماذج التوليدية لتصميم وطباعة قطع هندسية دقيقة عند الطلب." },
  { title: "Agentic AI for Coordinated Multi-Robot Task Execution", year: 2026, venue: "in progress", role: "Lead author", role_ar: "المؤلف الرئيس",
    status: "review", taxo: "agentic", tags: ["agentic AI", "multi-robot", "planning"], doi: "",
    abstract: "An agentic-AI framework that lets a fleet of robots reason about and execute tasks efficiently and safely.",
    abstract_ar: "إطار ذكاء وكيل يتيح لأسطول من الروبوتات الاستدلال وتنفيذ المهام بكفاءة وأمان." },
];

/* ── Robotics software-stack mental model (his work highlighted) ── */
export const STACK = [
  { lvl: "Layer 8", name: "Agentic AI & Multi-Robot", name_ar: "الذكاء الوكيل ومتعدد الروبوتات", mine: true,
    desc: "Agentic planners that let a fleet reason about and divide tasks.", desc_ar: "مخطّطات وكيلة تتيح للأسطول الاستدلال وتقسيم المهام.",
    tools: ["LLM agents", "task allocation", "behavior trees"] },
  { lvl: "Layer 7", name: "Middleware & Orchestration", name_ar: "الوسطية والتنسيق", mine: true,
    desc: "ROS 2 / DDS graph: nodes, topics, lifecycle, real-time. Authored the ROS 2 survey.", desc_ar: "رسم ROS 2 / DDS: العُقد، المواضيع، دورة الحياة، الزمن الحقيقي. مؤلف مسح ROS 2.",
    tools: ["ROS 2", "DDS", "lifecycle nodes"] },
  { lvl: "Layer 6", name: "Planning & Prediction", name_ar: "التخطيط والتوقّع", mine: true,
    desc: "Trajectory prediction (VECTOR, D2DTracker) and path planning for agile tracking.", desc_ar: "توقّع المسار (VECTOR، D2DTracker) وتخطيط المسار للتتبّع السريع.",
    tools: ["GRU", "Nav2", "model selection"] },
  { lvl: "Layer 5", name: "Control", name_ar: "التحكّم", mine: true,
    desc: "Offboard UAV control via MAVROS/PX4; low-level attitude & position loops.", desc_ar: "تحكّم خارجي بالطائرات عبر MAVROS/PX4؛ حلقات الوضع والموقع.",
    tools: ["PX4", "MAVROS", "PID / cascade"] },
  { lvl: "Layer 4", name: "State Estimation & Localization", name_ar: "تقدير الحالة والتموضع", mine: true,
    desc: "The core: GPS-denied localization, residual EKF, sensor fusion. Two journal papers.", desc_ar: "الجوهر: التموضع دون GPS، مرشّح كالمان البقايا، دمج الحساسات. بحثان محكّمان.",
    tools: ["EKF", "VIO", "XGBoost+KAN"] },
  { lvl: "Layer 3", name: "Perception", name_ar: "الإدراك", mine: true,
    desc: "Visual-inertial odometry (RoboEye), object & drone detection/tracking.", desc_ar: "القياس البصري-القصوري (RoboEye)، كشف وتتبّع الأجسام والطائرات.",
    tools: ["stereo VIO", "detection", "tracking"] },
  { lvl: "Layer 2", name: "Sensing & Drivers", name_ar: "الاستشعار والمشغّلات", mine: true,
    desc: "Cameras, IMU, LiDAR, GNSS — and the RoboEye sensor kit (patented).", desc_ar: "كاميرات، IMU، ليدار، GNSS — وحساس RoboEye (براءة).",
    tools: ["camera/IMU", "LiDAR", "RoboEye kit"] },
  { lvl: "Layer 1", name: "Simulation & Sim2Real", name_ar: "المحاكاة والنقل للواقع", mine: true,
    desc: "Gazebo / PX4 SITL worlds and the FLIGHTGEN automated dataset generator.", desc_ar: "عوالم Gazebo / PX4 SITL ومولّد البيانات الآلي FLIGHTGEN.",
    tools: ["Gazebo", "PX4 SITL", "FLIGHTGEN"] },
];

export const CALISTHENICS = {
  list: ["Muscle-ups", "Front lever", "Planche progressions", "Handstand", "Pull-ups", "Dips", "L-sit", "Pistol squats"],
  list_ar: ["العضلة المرتفعة", "الرافعة الأمامية", "تدرّجات البلانش", "الوقوف على اليدين", "العقلة", "الغطس", "جلسة L", "القرفصاء الأحادية"],
};

/* ── UI strings ── */
export const I18N = {
  en: {
    nav_about: "About", nav_research: "Research", nav_projects: "Projects", nav_gallery: "Gallery", nav_experience: "Experience",
    nav_cta: "Get in touch", lang_btn: "ع",
    hero_kicker: "Robotics & Autonomous Intelligent Systems",
    hero_l1: "I build robots that", hero_l2: "fly, drive, and see.",
    hero_sub: "Senior Research Assistant at PSU's Robotics & IoT Lab — designing UAVs, ground robots, and the perception that keeps them located when GPS goes dark. Next stop: a PhD at KFUPM.",
    hero_cta1: "Explore the work →", hero_cta2: "Read the research",
    eb_about: "About", t_about: "From the CAD seed to the first flight.",
    about_p1: "Six years turning mechanical design, UAV autonomy, and reinforcement learning into machines that work in the real world — drones, ground robots, and the perception kits that keep them located when GPS goes dark.",
    about_origin: "It started as a childhood dream of being an inventor — not an engineer. The machines just made it real.",
    about_meta: "M.Sc. Robotics (KFUPM) · Senior Research Assistant at Prince Sultan University · heading to a PhD at KFUPM. Based in Riyadh, moving to Khobar.",
    eb_research: "Research", t_research: "A path through the publications.",
    lead_research: "Peer-reviewed work in UAV localization, trajectory prediction, ROS 2, and Arabic NLP — at ACM Computing Surveys, IEEE, Springer, and ACL.",
    eb_projects: "Projects", t_projects: "Eight machines, built to leave the bench.",
    lead_projects: "Drag to orbit the gallery — tap any project to open it. VTOLs, warehouse and hotel robots, agricultural drones, and the sensor kits behind them.",
    hint_sphere: "drag ⟲ to explore · tap to open",
    eb_gallery: "Gallery", t_gallery: "Hardware, in the metal.",
    gal_robots: "Robots & UAVs", gal_prints: "3D printing & fabrication",
    eb_patents: "Patents", t_patents: "Two granted industrial designs.",
    eb_track: "Track record", t_track: "Experience & education.", h_exp: "Experience", h_edu: "Education",
    eb_toolkit: "Toolkit", t_toolkit: "What I work with.",
    eb_oss: "Open source", t_oss: "Code on GitHub.", lead_oss: "ROS 2 stacks for UAV autonomy, drone-to-drone tracking, and simulation tooling.",
    eb_beyond: "Beyond work", t_beyond: "Discipline, off the clock.",
    lead_beyond: "When I'm not building robots, I train calisthenics — the same loop as engineering: small consistent reps, honest feedback, compounding gains. Faith, family, and fabrication keep the rest in balance.",
    eb_contact: "Contact", t_contact: "Let's build something that flies.",
    lb_close: "Close", lb_prev: "Previous", lb_next: "Next",
    tab_home: "Home", tab_beyond: "Beyond career",
    eb_stack: "How robotics fits together", t_stack: "My mental model of the robot software stack.",
    lead_stack: "From sensors to agents — every layer of an autonomous system, and where my work lives. Highlighted layers are ones I've built or published in.",
    stack_mine: "I've worked here", stack_legend_mine: "Layers I built / published", stack_legend_other: "Context layers",
    pubdb_title: "Browse every publication", pubdb_lead: "Search, filter by research area, and sort. Click a row for the abstract.",
    pubdb_search: "Search title, venue, tag…", pubdb_allyears: "All years", pubdb_allstatus: "All status",
    pubdb_count: "results", col_paper: "Paper", col_year: "Year", col_area: "Area", col_status: "Status", col_doi: "DOI",
    st_published: "Published", st_accepted: "Accepted", st_review: "In progress",
    beyond_kicker: "Off the clock", beyond_title: "Beyond the lab.", beyond_lead: "The same discipline that builds robots — pointed at a mountain, a pull-up bar, and a very long watchlist.",
    cal_eb: "Training", cal_title: "Calisthenics.", cal_lead: "Bodyweight strength — the engineer's loop: small consistent reps, honest feedback, gains that compound. A few of the moves I train:",
    coll_eb: "Collections", coll_title: "What I watch & play.", coll_lead: "A running database of favorite films, series, games, and manga — pulled straight from my vault.",
    m_all: "All", m_movie: "Movies", m_series: "Series", m_game: "Games", m_manga: "Manga", m_sort_rating: "Top rated", m_sort_year: "Newest", m_count: "titles",
    research_more: "Browse the full publications database ↓",
  },
  ar: {
    nav_about: "نبذة", nav_research: "الأبحاث", nav_projects: "المشاريع", nav_gallery: "المعرض", nav_experience: "الخبرة",
    nav_cta: "تواصل معي", lang_btn: "EN",
    hero_kicker: "الروبوتات والأنظمة الذكية المستقلة",
    hero_l1: "أبني روبوتاتٍ", hero_l2: "تطير، وتسير، وتُبصر.",
    hero_sub: "باحث أول في معمل الروبوتات وإنترنت الأشياء بجامعة الأمير سلطان — أُصمّم طائرات مسيّرة وروبوتات أرضية والإدراك الذي يُبقيها متموضِعة حين ينقطع GPS. والوجهة القادمة: الدكتوراه في جامعة الملك فهد للبترول والمعادن.",
    hero_cta1: "استكشف الأعمال ←", hero_cta2: "اقرأ الأبحاث",
    eb_about: "نبذة", t_about: "من بذرة التصميم إلى أول إقلاع.",
    about_p1: "ستّ سنوات في تحويل التصميم الميكانيكي واستقلالية الطائرات والتعلّم المعزّز إلى آلاتٍ تعمل في الواقع — طائرات مسيّرة وروبوتات أرضية وحساسات تُبقيها متموضِعة حين ينقطع نظام تحديد المواقع.",
    about_origin: "بدأ الأمر حلمًا في الطفولة بأن أكون مُخترعًا — لا مهندسًا. والآلات هي ما جعلت الحلم حقيقة.",
    about_meta: "ماجستير الروبوتات (KFUPM) · باحث أول بجامعة الأمير سلطان · متوجّه إلى الدكتوراه في KFUPM. مقيم في الرياض ومنتقل إلى الخبر.",
    eb_research: "الأبحاث", t_research: "مسارٌ عبر المنشورات.",
    lead_research: "أعمال محكّمة في تموضع الطائرات وتوقّع المسارات وROS 2 ومعالجة اللغة العربية — في ACM Computing Surveys وIEEE وSpringer وACL.",
    eb_projects: "المشاريع", t_projects: "ثماني آلاتٍ بُنيت لتغادر الطاولة.",
    lead_projects: "اسحب لتدوير المعرض — واضغط على أي مشروع لفتحه. طائرات VTOL، وروبوتات مستودعات وفنادق، ودرون زراعي، والحساسات التي تقف خلفها.",
    hint_sphere: "اسحب ⟲ للاستكشاف · اضغط للفتح",
    eb_gallery: "المعرض", t_gallery: "العتاد، على الطبيعة.",
    gal_robots: "الروبوتات والطائرات", gal_prints: "الطباعة ثلاثية الأبعاد والتصنيع",
    eb_patents: "البراءات", t_patents: "تصميمان صناعيّان ممنوحان.",
    eb_track: "السجلّ", t_track: "الخبرة والتعليم.", h_exp: "الخبرة", h_edu: "التعليم",
    eb_toolkit: "الأدوات", t_toolkit: "ما أعمل به.",
    eb_oss: "مفتوح المصدر", t_oss: "شيفرات على GitHub.", lead_oss: "حزم ROS 2 لاستقلالية الطائرات، واعتراض الدرون بالدرون، وأدوات المحاكاة.",
    eb_beyond: "خارج العمل", t_beyond: "انضباطٌ بعيدًا عن المكتب.",
    lead_beyond: "حين لا أبني الروبوتات، أتمرّن على الكاليسثينكس — وهي الحلقة ذاتها في الهندسة: تكراراتٌ صغيرة ثابتة، وتغذية راجعة صادقة، ومكاسب تتراكم. الإيمان والعائلة والتصنيع تُبقي البقية متوازنة.",
    eb_contact: "تواصل", t_contact: "لنبنِ شيئًا يطير.",
    lb_close: "إغلاق", lb_prev: "السابق", lb_next: "التالي",
    tab_home: "الرئيسية", tab_beyond: "خارج العمل",
    eb_stack: "كيف تتكامل الروبوتات", t_stack: "نموذجي الذهني لطبقات برمجيات الروبوت.",
    lead_stack: "من الحساسات إلى الوكلاء — كل طبقة في النظام المستقل، وأين يقع عملي. الطبقات المميّزة بنيتُها أو نشرتُ فيها.",
    stack_mine: "عملتُ هنا", stack_legend_mine: "طبقات بنيتُها / نشرتُ فيها", stack_legend_other: "طبقات سياقية",
    pubdb_title: "تصفّح كل المنشورات", pubdb_lead: "ابحث، صفِّ حسب مجال البحث، ورتِّب. اضغط الصف لقراءة الملخّص.",
    pubdb_search: "ابحث في العنوان أو المحفل أو الوسم…", pubdb_allyears: "كل السنوات", pubdb_allstatus: "كل الحالات",
    pubdb_count: "نتيجة", col_paper: "البحث", col_year: "السنة", col_area: "المجال", col_status: "الحالة", col_doi: "DOI",
    st_published: "منشور", st_accepted: "مقبول", st_review: "قيد العمل",
    beyond_kicker: "خارج الدوام", beyond_title: "خارج المختبر.", beyond_lead: "الانضباط نفسه الذي يبني الروبوتات — موجّهًا نحو جبل، وعقلة، وقائمة مشاهدة طويلة.",
    cal_eb: "تدريب", cal_title: "الكاليسثينكس.", cal_lead: "قوّة وزن الجسم — حلقة المهندس: تكراراتٌ صغيرة ثابتة، تغذية راجعة صادقة، ومكاسب تتراكم. بعض الحركات التي أتمرّن عليها:",
    coll_eb: "تجميعات", coll_title: "ما أشاهده وألعبه.", coll_lead: "قاعدة بيانات متجدّدة لأفلامي ومسلسلاتي وألعابي والمانجا — مسحوبة مباشرة من القبو.",
    m_all: "الكل", m_movie: "أفلام", m_series: "مسلسلات", m_game: "ألعاب", m_manga: "مانجا", m_sort_rating: "الأعلى تقييمًا", m_sort_year: "الأحدث", m_count: "عنوانًا",
    research_more: "تصفّح قاعدة المنشورات كاملة ↓",
  },
};
