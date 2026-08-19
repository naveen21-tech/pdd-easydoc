import { SlideItem, PresentationStyle } from '@/lib/types';

export type PresentationTemplateCategory = 'Academic' | 'College' | 'Research' | 'Business' | 'Professional';

export interface PresentationTemplateItem {
  id: string;
  name: string;
  category: PresentationTemplateCategory;
  style: PresentationStyle;
  description: string;
  slideCount: number;
  iconName: string;
  accentColor: string;
  badgeBg: string;
  slides: Omit<SlideItem, 'id'>[];
}

export const PRESENTATION_TEMPLATE_CATEGORIES: { id: string; name: string }[] = [
  { id: 'All', name: 'All Templates' },
  { id: 'Academic', name: 'Academic' },
  { id: 'College', name: 'College Projects' },
  { id: 'Research', name: 'Research Defense' },
  { id: 'Business', name: 'Business & Pitch' },
  { id: 'Professional', name: 'Professional & Tech' },
];

export const DEFAULT_PRESENTATION_TEMPLATES: PresentationTemplateItem[] = [
  // -------------------------------------------------------------
  // 1. Academic Presentation (8 slides)
  // -------------------------------------------------------------
  {
    id: 'academic-presentation',
    name: 'Academic Presentation',
    category: 'Academic',
    style: 'Academic',
    description: 'Structured academic defense with introduction, methodology, empirical findings, and references.',
    slideCount: 8,
    iconName: 'GraduationCap',
    accentColor: '#7C3AED',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    slides: [
      {
        slideNumber: 1,
        title: 'Academic Thesis & Subject Presentation',
        subtitle: 'Department of Computer Science & Academic Review Board',
        bullets: [
          'Candidate: Student Name & Roll Number',
          'Supervisor / Faculty Guide: Prof. Academic Advisor',
          'Institutional Academic Session: 2025 – 2026',
        ],
        layout: 'title',
        notes: 'Introduce yourself, state your research thesis or subject topic, and acknowledge your faculty guide.',
      },
      {
        slideNumber: 2,
        title: 'Introduction & Theoretical Background',
        subtitle: 'Foundational context, domain motivation, and scope',
        bullets: [
          'Historical evolution and core theoretical foundations of the domain',
          'Primary motivations and current technological limitations',
          'Significance of study to current academic and industry practices',
          'Scope boundaries and targeted evaluation dimensions',
        ],
        layout: 'content',
        notes: 'Provide a clear overview of the subject domain and why this academic inquiry is timely.',
      },
      {
        slideNumber: 3,
        title: 'Aims & Research Objectives',
        subtitle: 'Core benchmarks and research milestones',
        bullets: [
          'Primary Objective: Formulate and evaluate a standardized conceptual framework',
          'Secondary Objective: Benchmark algorithmic performance against legacy baselines',
          'Experimental Target: Validate accuracy, latency, and fault tolerance under load',
          'Deliverable: Published academic report with reproducible datasets',
        ],
        layout: 'split',
        notes: 'Enumerate the primary and secondary research questions your study addresses.',
      },
      {
        slideNumber: 4,
        title: 'Main Content & Conceptual Framework',
        subtitle: 'In-depth analysis of core principles and architectures',
        bullets: [
          'Modular theoretical decomposition into functional layers',
          'Mathematical formulations, state transitions, and boundary constraints',
          'Data structures and algorithm design choices for optimal throughput',
          'Comparative advantages over classical single-tier models',
        ],
        layout: 'content',
        notes: 'Dive into the core mechanisms and intellectual contribution of your work.',
      },
      {
        slideNumber: 5,
        title: 'Methodology & Experimental Setup',
        subtitle: 'Research design, tools, datasets, and execution steps',
        bullets: [
          'Dataset Curation: Cleaned, normalized, and partitioned (80/20 train-test)',
          'Simulation Environment: High-performance compute nodes with automated telemetry',
          'Evaluation Metrics: Precision, Recall, F1-Score, Execution Latency, and Memory Footprint',
          'Verification Protocol: 5-fold cross-validation with statistical significance tests',
        ],
        layout: 'split',
        notes: 'Explain your scientific methodology and how you ensured reproducible results.',
      },
      {
        slideNumber: 6,
        title: 'Results & Quantitative Findings',
        subtitle: 'Measured empirical performance and benchmarks',
        bullets: [
          'Achieved 96.4% classification accuracy across all evaluation datasets',
          'Reduced end-to-end processing latency by 38.2% compared to baseline',
          'Zero data divergence observed across 10,000+ stress-test iterations',
          'Statistical p-value < 0.001 confirming significant improvement',
        ],
        layout: 'stats',
        notes: 'Present key empirical metrics with clear comparisons to existing benchmarks.',
      },
      {
        slideNumber: 7,
        title: 'Conclusion & Future Directions',
        subtitle: 'Summary of contributions and prospective roadmap',
        bullets: [
          'Successfully validated the core hypothesis with reproducible empirical evidence',
          'Demonstrated viable practical application in high-throughput environments',
          'Future Scope: Edge deployment, federated learning integration, and multi-modal scaling',
          'Key Takeaway: Established an extensible framework for subsequent research cohorts',
        ],
        layout: 'conclusion',
        notes: 'Summarize key takeaways, limitations, and future research opportunities.',
      },
      {
        slideNumber: 8,
        title: 'References & Citations',
        subtitle: 'Peer-reviewed literature and authoritative sources',
        bullets: [
          '[1] IEEE Transactions on Neural Networks and Learning Systems (2024)',
          '[2] ACM Computing Surveys: Distributed Architecture & Consensus (2023)',
          '[3] Springer Lecture Notes in Computer Science: Advanced Algorithms (2024)',
          '[4] Official Documentation, Open Source Repositories & Benchmark Datasets',
        ],
        layout: 'content',
        notes: 'Acknowledge academic references and invite final questions from the committee.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 2. College Project Presentation (12 slides)
  // -------------------------------------------------------------
  {
    id: 'college-project-presentation',
    name: 'College Project Presentation',
    category: 'College',
    style: 'Project Viva',
    description: 'Comprehensive 12-slide template for capstone and semester project reviews with architecture and modules.',
    slideCount: 12,
    iconName: 'Laptop',
    accentColor: '#9333EA',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    slides: [
      {
        slideNumber: 1,
        title: 'Capstone Engineering Project Title',
        subtitle: 'Final Year Major Project Presentation & Defense',
        bullets: [
          'Project Title: Intelligent Student Documentation & Examination Platform',
          'Department of Computer Science and Engineering',
          'Academic Year: 2025 – 2026',
        ],
        layout: 'title',
        notes: 'Welcome the examination panel, introduce project title and institution details.',
      },
      {
        slideNumber: 2,
        title: 'Team Members & Role Distribution',
        subtitle: 'Project contributors and module ownership',
        bullets: [
          'Member 1 (Team Lead): System Architecture, Cloud Backend & APIs',
          'Member 2: Frontend Engineering, UI/UX & Responsive Views',
          'Member 3: Database Design, Prisma ORM & Security Policies',
          'Member 4: Quality Assurance, Automated Unit Testing & Documentation',
        ],
        layout: 'split',
        notes: 'Introduce all team members and their designated areas of technical responsibility.',
      },
      {
        slideNumber: 3,
        title: 'Problem Statement & Motivation',
        subtitle: 'Challenges addressed by this project',
        bullets: [
          'Existing systems suffer from fragmented tools, poor collaboration, and manual paperwork',
          'High latency and lack of automated grading in classroom examination workflows',
          'Zero privacy enforcement for student assignments in legacy portals',
          'Need for an all-in-one AI-assisted platform for documents, MCQs, and presentations',
        ],
        layout: 'content',
        notes: 'Articulate the real-world problem and why a new solution was necessary.',
      },
      {
        slideNumber: 4,
        title: 'Project Objectives',
        subtitle: 'Targeted functional deliverables and scope',
        bullets: [
          'Develop an end-to-end cloud web and mobile platform for college classrooms',
          'Implement AI-powered automated MCQ test builder with sub-second scoring',
          'Enforce strict submitter privacy: Teachers see all, students see only their own work',
          'Provide multi-format export across PDF, Word DOCX, and Keynote PPTX',
        ],
        layout: 'content',
        notes: 'List the specific goals and metrics the project successfully accomplished.',
      },
      {
        slideNumber: 5,
        title: 'Existing System vs. Limitations',
        subtitle: 'Shortcomings of conventional solutions',
        bullets: [
          'Manual paper submissions and unindexed physical record keeping',
          'High faculty workload in question authoring, paper checking, and record entry',
          'No real-time analytics on student pass rates or question difficulty',
          'Inconsistent formatting without standardized academic templates',
        ],
        layout: 'split',
        notes: 'Compare legacy manual methods with the inefficiencies you set out to solve.',
      },
      {
        slideNumber: 6,
        title: 'Proposed System & Key Innovations',
        subtitle: 'Novel features and unique advantages',
        bullets: [
          'Centralized Cloud Hub: Instant classroom creation with 6-character Join Codes',
          'AI Question Synthesis: Generates 1 to 50 questions instantly from topic titles',
          'Live Exam Taking: Countdown timer, 1..N question palette, and auto-submit at 00:00',
          'Grounded AI Generation: Ingests uploaded lecture notes directly into prompts',
        ],
        layout: 'content',
        notes: 'Highlight your unique engineering contributions and feature highlights.',
      },
      {
        slideNumber: 7,
        title: 'Technology Stack & Frameworks',
        subtitle: 'Full-stack software and toolchain selection',
        bullets: [
          'Frontend: Next.js 14 App Router, React 18, Tailwind CSS, Lucide Icons',
          'Backend: Next.js Serverless Functions, Node.js runtime, Zod schema validation',
          'Mobile App: Flutter 3.x, Dart SDK, Material 3 UI design system',
          'Database & Auth: PostgreSQL on Supabase Cloud, Prisma ORM connection pool',
        ],
        layout: 'stats',
        notes: 'Walk through your chosen tech stack and justify why each tool was selected.',
      },
      {
        slideNumber: 8,
        title: 'System Architecture & Data Flow',
        subtitle: 'High-level component hierarchy and database interactions',
        bullets: [
          'Client Layer: Web Browser & Flutter Mobile App with JWT auth session storage',
          'API Gateway: 39 RESTful serverless endpoints with role-based access control',
          'ORM & Database: Prisma Client connecting to PostgreSQL relational tables',
          'AI Orchestration: High-Speed Groq Cloud LPU Engine (llama-3.3-70b-versatile)',
        ],
        layout: 'split',
        notes: 'Explain your architectural layers from client requests down to the database.',
      },
      {
        slideNumber: 9,
        title: 'Core Modules & Implementation Details',
        subtitle: 'Functional breakdown of primary system subsystems',
        bullets: [
          'Module 1: Classroom & Group Collaboration with code-based enrollment',
          'Module 2: Shared Documents Hub with student submission privacy filter',
          'Module 3: MCQ Examination Studio with real-time scoring and faculty analytics',
          'Module 4: Multi-Format Document Synthesis & PPTX Keynote Engine',
        ],
        layout: 'content',
        notes: 'Detail each major module and describe how they interact seamlessly.',
      },
      {
        slideNumber: 10,
        title: 'Results, Live Demo & Verification',
        subtitle: 'Experimental validation and system benchmarks',
        bullets: [
          '100% test pass rate across 48 automated test suites (490/490 unit tests)',
          'Sub-200ms API response latency for classroom and submission queries',
          'Instant 1-tap APK deployment on Android devices (ARM64 & x86_64)',
          'Full end-to-end verification across Chrome, Firefox, Safari, and Mobile',
        ],
        layout: 'stats',
        notes: 'Present screenshots, test results, and prepare for the live demonstration.',
      },
      {
        slideNumber: 11,
        title: 'Future Scope & Enhancements',
        subtitle: 'Roadmap for future iterations and scaling',
        bullets: [
          'Plagiarism detection and automated code execution for programming assignments',
          'Offline synchronization with SQLite local storage on mobile devices',
          'Real-time collaborative live document editing via WebSockets',
          'Audio-based viva examinations with speech-to-text response scoring',
        ],
        layout: 'content',
        notes: 'Show that you have thought about future growth and commercial viability.',
      },
      {
        slideNumber: 12,
        title: 'Conclusion & Viva Defense',
        subtitle: 'Summary of achievements and committee Q&A',
        bullets: [
          'Delivered a fully functional, cloud-native document and classroom suite',
          'Successfully satisfied all academic requirements and engineering standards',
          'Project source code, documentation, and live deployments verified',
          'Thank you! The team is now open for questions and feedback.',
        ],
        layout: 'conclusion',
        notes: 'Conclude with confidence and invite the panel to ask technical questions.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 3. Seminar Presentation (10 slides)
  // -------------------------------------------------------------
  {
    id: 'seminar-presentation',
    name: 'Seminar Presentation',
    category: 'Academic',
    style: 'Technical',
    description: '10-slide technical seminar deck with background, key concepts, applications, challenges, and future trends.',
    slideCount: 10,
    iconName: 'BookOpen',
    accentColor: '#2563EB',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    slides: [
      {
        slideNumber: 1,
        title: 'Technical Seminar Topic Title',
        subtitle: 'Department Seminar Series • Emerging Technologies',
        bullets: [
          'Presented by: Student Name (Roll No: CSE2026)',
          'Department of Computer Science & Engineering',
          'Seminar Date: Academic Semester Review',
        ],
        layout: 'title',
        notes: 'Welcome faculty and student peers to the technical seminar presentation.',
      },
      {
        slideNumber: 2,
        title: 'Introduction & Topic Overview',
        subtitle: 'What is the core technology and why does it matter?',
        bullets: [
          'High-level conceptual overview and foundational principles',
          'Shift from legacy computing paradigms to modern decentralized approaches',
          'Growing adoption across enterprise, academic, and consumer sectors',
          'Roadmap of this seminar session and key focus areas',
        ],
        layout: 'content',
        notes: 'Define the subject clearly and set expectations for the seminar session.',
      },
      {
        slideNumber: 3,
        title: 'Background & Historical Context',
        subtitle: 'Evolutionary milestones that enabled this technology',
        bullets: [
          'Early inception and theoretical origins in computer science literature',
          'Key algorithmic breakthroughs that removed previous computational bottlenecks',
          'Hardware accelerators (GPUs, TPUs) and cloud infrastructure readiness',
          'Transition from experimental prototypes to mission-critical production systems',
        ],
        layout: 'content',
        notes: 'Trace the lineage and milestones leading to current state-of-the-art.',
      },
      {
        slideNumber: 4,
        title: 'Key Concepts & Working Principles',
        subtitle: 'Underlying mechanism and architecture',
        bullets: [
          'Core Concept A: High-throughput pipelining and data abstraction',
          'Core Concept B: Deterministic state management and consensus protocols',
          'Core Concept C: Asynchronous event handling and distributed telemetry',
          'Interaction Model: How subsystems coordinate across network boundaries',
        ],
        layout: 'split',
        notes: 'Explain the core mechanics with technical accuracy and clarity.',
      },
      {
        slideNumber: 5,
        title: 'Advantages & Major Benefits',
        subtitle: 'Why organizations and developers adopt this solution',
        bullets: [
          'Scalability: Seamless horizontal expansion across multi-region nodes',
          'Efficiency: Significant reduction in computational overhead and memory usage',
          'Fault Tolerance: Automated failover and zero-downtime rolling updates',
          'Developer Velocity: Modular APIs and rich open-source tooling ecosystems',
        ],
        layout: 'content',
        notes: 'Enumerate the primary benefits supported by technical rationales.',
      },
      {
        slideNumber: 6,
        title: 'Real-World Applications & Use Cases',
        subtitle: 'Industry implementations and domain deployments',
        bullets: [
          'Healthcare: Real-time diagnostic inference and secure patient telemetry',
          'Financial Technology: High-frequency fraud detection and ledger auditing',
          'Smart Infrastructure: IoT sensor networks and autonomous municipal routing',
          'Academic Platforms: Intelligent learning management and automated grading',
        ],
        layout: 'stats',
        notes: 'Highlight practical industry deployments and case studies.',
      },
      {
        slideNumber: 7,
        title: 'Challenges & Open Issues',
        subtitle: 'Current hurdles, trade-offs, and technical bottlenecks',
        bullets: [
          'Data Security & Privacy: Mitigating adversarial prompt attacks and leakages',
          'Latency Bounds: Minimizing edge inference lag under constrained networks',
          'Interoperability: Legacy system integration and schema migration overheads',
          'Resource Consumption: Managing GPU/TPU power efficiency at scale',
        ],
        layout: 'split',
        notes: 'Discuss technical trade-offs openly and acknowledge current limitations.',
      },
      {
        slideNumber: 8,
        title: 'Future Trends & Emerging Directions',
        subtitle: 'What does the next decade hold for this field?',
        bullets: [
          'Edge AI & TinyML: Local inference on ultra-low-power microcontrollers',
          'Quantum Integration: Hybrid classical-quantum cryptographic protocols',
          'Autonomous Agent Swarms: Self-healing and auto-scaling distributed systems',
          'Standardization: Universal cross-platform specifications and benchmarks',
        ],
        layout: 'content',
        notes: 'Share forward-looking insights and prospective research trends.',
      },
      {
        slideNumber: 9,
        title: 'Conclusion & Key Takeaways',
        subtitle: 'Core summary of the seminar presentation',
        bullets: [
          'This technology represents a paradigm shift in modern computing systems',
          'Addresses critical performance, security, and scalability bottlenecks',
          'Continuous innovation is required to overcome current resource constraints',
          'Essential foundation for future cloud and software engineering architectures',
        ],
        layout: 'conclusion',
        notes: 'Recap the central message and leave the audience with lasting takeaways.',
      },
      {
        slideNumber: 10,
        title: 'References & Q&A Discussion',
        subtitle: 'Authoritative literature and open floor for questions',
        bullets: [
          '[1] ACM Digital Library: Technical Seminar Proceedings (2024)',
          '[2] IEEE Computer Society: Emerging Architecture Standards (2023)',
          '[3] O\'Reilly & Springer Technical Compendiums (2024)',
          'Thank you! Questions and discussions are warmly welcomed.',
        ],
        layout: 'content',
        notes: 'Open the floor for questions, comments, and collaborative discussions.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 4. Research Presentation (10 slides)
  // -------------------------------------------------------------
  {
    id: 'research-presentation',
    name: 'Research Presentation',
    category: 'Research',
    style: 'Academic',
    description: '10-slide scholarly presentation for paper defense, research symposiums, and literature findings.',
    slideCount: 10,
    iconName: 'Microscope',
    accentColor: '#059669',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    slides: [
      {
        slideNumber: 1,
        title: 'Scholarly Research Paper Title',
        subtitle: 'Doctoral / Master\'s Thesis Defense & Peer Review',
        bullets: [
          'Primary Author: Research Scholar Name',
          'Co-Authors & Faculty Advisor: Prof. Department Chair',
          'Research Laboratory & Affiliation: Center for Advanced Computing',
        ],
        layout: 'title',
        notes: 'Introduce your research paper title, co-authors, and institution.',
      },
      {
        slideNumber: 2,
        title: 'Abstract & Executive Summary',
        subtitle: 'Condensed research overview, hypothesis, and outcomes',
        bullets: [
          'Context: Rapid growth in complex data streams demands scalable processing',
          'Problem: Classical architectures experience exponential latency degradation',
          'Proposed Solution: A novel multi-tiered optimization algorithm with formal guarantees',
          'Outcome: 42% latency reduction with zero loss in mathematical precision',
        ],
        layout: 'content',
        notes: 'Deliver a concise 60-second summary of your entire research paper.',
      },
      {
        slideNumber: 3,
        title: 'Introduction & Motivation',
        subtitle: 'Theoretical underpinnings and real-world significance',
        bullets: [
          'Theoretical motivation grounded in computational complexity theory',
          'Real-world consequences of unoptimized pipeline throughput',
          'Key Research Questions: Can latency be minimized without sacrificing consistency?',
          'Contribution: Formulated an empirical framework with mathematical proofs',
        ],
        layout: 'content',
        notes: 'Motivate the problem and define the specific research questions investigated.',
      },
      {
        slideNumber: 4,
        title: 'Literature Review & Related Works',
        subtitle: 'Taxonomy of existing models and historical approaches',
        bullets: [
          'Classical Models (2018-2021): High reliability but limited concurrency bounds',
          'Heuristic Approaches (2022-2023): Fast execution with variable error margins',
          'Recent Neural Paradigms (2024): Strong accuracy with high GPU cost overheads',
          'Positioning: Our work bridges heuristic speed with mathematical rigor',
        ],
        layout: 'split',
        notes: 'Summarize the landscape of related literature and position your work.',
      },
      {
        slideNumber: 5,
        title: 'Research Gap & Problem Formulation',
        subtitle: 'The precise unresolved challenge solved by this study',
        bullets: [
          'Identified Gap: Lack of deterministic guarantees in dynamic load environments',
          'Mathematical Formulation: Formulated as a constrained optimization problem',
          'Boundary Conditions: Multi-tenant concurrency with strict SLA latency limits',
          'Hypothesis: A hybrid caching and predictive routing model will achieve Pareto optimality',
        ],
        layout: 'split',
        notes: 'Clearly define the exact research gap that previous papers failed to resolve.',
      },
      {
        slideNumber: 6,
        title: 'Methodology & Proposed Framework',
        subtitle: 'Architectural design, algorithms, and proofs',
        bullets: [
          'Algorithm Phase 1: Adaptive token partitioning with dynamic weight allocation',
          'Algorithm Phase 2: Speculative execution and state deduplication',
          'Formal Proof: Proven O(log N) worst-case time complexity',
          'Implementation: High-throughput asynchronous Rust & Next.js backend services',
        ],
        layout: 'content',
        notes: 'Explain your proposed methodology, algorithms, and theoretical guarantees.',
      },
      {
        slideNumber: 7,
        title: 'Experimental Setup & Datasets',
        subtitle: 'Benchmark corpora, hardware nodes, and metrics',
        bullets: [
          'Datasets: 3 standard academic benchmark corpora (500K+ records each)',
          'Hardware: Distributed cluster across 8 compute nodes with NVMe storage',
          'Baselines: Evaluated against 4 leading state-of-the-art implementations',
          'Metrics: Throughput (RPS), Mean Latency (p99), and Memory Utilization',
        ],
        layout: 'stats',
        notes: 'Describe the experimental environment to establish scientific credibility.',
      },
      {
        slideNumber: 8,
        title: 'Results & Comparative Analysis',
        subtitle: 'Empirical data, statistical benchmarks, and validation',
        bullets: [
          'Throughput: 3.4x higher requests per second compared to closest competitor',
          'P99 Latency: Consistently maintained under 45ms across all test runs',
          'Resource Footprint: 28% reduction in memory consumption under peak stress',
          'Statistical Significance: Verified across 10 independent trials with p < 0.001',
        ],
        layout: 'stats',
        notes: 'Walk through empirical findings with chart data and statistical proof.',
      },
      {
        slideNumber: 9,
        title: 'Discussion & Limitations',
        subtitle: 'Critical interpretation of results and boundary conditions',
        bullets: [
          'Why the framework succeeds: Dynamic pruning eliminates redundant computations',
          'Observed Limitation: Cold-start latency requires warm pool pre-allocation',
          'Threats to Validity: Evaluation was conducted in synthetic benchmark clusters',
          'Mitigation: Real-world pilot trials planned with enterprise research partners',
        ],
        layout: 'split',
        notes: 'Provide an honest, scholarly assessment of results and constraints.',
      },
      {
        slideNumber: 10,
        title: 'Conclusion & References',
        subtitle: 'Summary of contributions and bibliography',
        bullets: [
          'Established a validated, peer-reviewed algorithmic framework with superior metrics',
          'Code, datasets, and benchmark scripts open-sourced under MIT License',
          'References: IEEE Transactions on Software Engineering (2024), ACM TODS (2023)',
          'Questions, suggestions, and peer discussions are welcomed.',
        ],
        layout: 'conclusion',
        notes: 'Conclude and thank the peer reviewers and audience.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 5. Project Viva Presentation (10 slides)
  // -------------------------------------------------------------
  {
    id: 'project-viva-presentation',
    name: 'Project Viva Presentation',
    category: 'College',
    style: 'Project Viva',
    description: '10-slide viva defense presentation covering problem, architecture, implementation, challenges, and demo.',
    slideCount: 10,
    iconName: 'Award',
    accentColor: '#D946EF',
    badgeBg: 'bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
    slides: [
      {
        slideNumber: 1,
        title: 'Major Project Viva Voce Defense',
        subtitle: 'Final Examination Board Review & Demonstration',
        bullets: [
          'Project: Full-Stack Cloud Intelligence & Examination Suite',
          'Candidate: Student Full Name (Registration No: CS2026)',
          'Examiner Panel: External and Internal Board of Evaluators',
        ],
        layout: 'title',
        notes: 'Introduce yourself and state the project name to the viva examiners.',
      },
      {
        slideNumber: 2,
        title: 'Problem Statement & Need',
        subtitle: 'Why was this software solution engineered?',
        bullets: [
          'Inefficient manual handling of classroom test authoring and grading',
          'Lack of privacy in shared portals where students can inspect others\' work',
          'Absence of automated document synthesis from external research files',
          'High demand for cross-platform availability across Web and Mobile',
        ],
        layout: 'content',
        notes: 'Concisely explain the root problem your project solves.',
      },
      {
        slideNumber: 3,
        title: 'Aims & Specific Objectives',
        subtitle: 'Targeted milestones delivered in this project',
        bullets: [
          'Deliver responsive web application on Next.js 14 and mobile app on Flutter',
          'Build automated MCQ generator with instant 00:00 timer auto-submission',
          'Enforce strict submitter visibility: Faculty sees all, students see only their own',
          'Achieve 100% automated test coverage across authentication and API routes',
        ],
        layout: 'content',
        notes: 'Highlight the concrete engineering objectives you achieved.',
      },
      {
        slideNumber: 4,
        title: 'Technologies & Tooling Used',
        subtitle: 'Full-stack software architecture decisions',
        bullets: [
          'Frontend: Next.js 14, React 18, Tailwind CSS, Lucide Icons',
          'Backend: Serverless Functions, Prisma ORM, Zod Schema Validation',
          'Mobile: Flutter 3.x, Dart SDK, Android Release Bundle (APK)',
          'Database: Supabase Cloud PostgreSQL with Row-Level Security',
        ],
        layout: 'stats',
        notes: 'Explain your choice of technologies and modern architectural patterns.',
      },
      {
        slideNumber: 5,
        title: 'System Architecture & Data Flow',
        subtitle: 'Request lifecycles, auth tokens, and database routing',
        bullets: [
          'User Auth: JWT tokens with session persistence in secure HTTP cookies',
          'API Layer: 39 compiled serverless routes handling business logic',
          'AI Engine: Centralized Groq Cloud LPU service routing to llama-3.3-70b-versatile',
          'Data Storage: Relational schema managing Users, Groups, Docs, Tests, and Attempts',
        ],
        layout: 'split',
        notes: 'Walk examiners through your system architecture diagram.',
      },
      {
        slideNumber: 6,
        title: 'Module Implementation Details',
        subtitle: 'Deep dive into core functional modules',
        bullets: [
          'Classroom Hub: Create & join groups using 6-character uppercase codes',
          'Shared Files: Multi-format upload with student submission privacy filter',
          'MCQ Studio: Faculty test creator, live student exam timer, auto-grading',
          'Document Studio: Multi-page structured document generator and PPTX export',
        ],
        layout: 'content',
        notes: 'Explain how you wrote the code for each primary module.',
      },
      {
        slideNumber: 7,
        title: 'Results, Output Screens & Live Demo',
        subtitle: 'Working system demonstration and verification',
        bullets: [
          'Web App deployed live on Vercel Edge CDN with global availability',
          'Android APK compiled (54.7 MB) and tested on physical Android hardware',
          '490 automated unit tests passing with zero errors',
          'Live demonstration ready for examiner interaction',
        ],
        layout: 'stats',
        notes: 'Transition seamlessly into the live project demonstration.',
      },
      {
        slideNumber: 8,
        title: 'Engineering Challenges & Solutions',
        subtitle: 'Real technical hurdles faced and how they were overcome',
        bullets: [
          'Challenge 1: Handling exam countdown timers across page refreshes\n→ Solution: Server-side timestamp synchronization with local state recovery',
          'Challenge 2: Multi-format binary file exports (PPTX, DOCX, PDF)\n→ Solution: Client-side JS compilation without server load',
          'Challenge 3: Offline AI resilience\n→ Solution: Deterministic fallback generators',
        ],
        layout: 'split',
        notes: 'Show maturity by explaining complex problems you solved independently.',
      },
      {
        slideNumber: 9,
        title: 'Future Enhancements & Scalability',
        subtitle: 'Upcoming features and production roadmap',
        bullets: [
          'WebRTC live video proctoring during examination sessions',
          'Automated plagiarism detection using vector embedding search',
          'Real-time classroom chat and push notifications via WebSockets',
          'Native iOS build deployment on Apple App Store',
        ],
        layout: 'content',
        notes: 'Outline your roadmap for production expansion.',
      },
      {
        slideNumber: 10,
        title: 'Conclusion & Viva Voce Q&A',
        subtitle: 'Summary of project defense and examiner questions',
        bullets: [
          'Successfully engineered a full-stack document and examination suite',
          'Met all project requirements, design standards, and security policies',
          'Full source code repository, documentation, and live links submitted',
          'Thank you! Open for examiner questions and feedback.',
        ],
        layout: 'conclusion',
        notes: 'Conclude respectfully and invite questions from the examiners.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 6. Business Presentation (10 slides)
  // -------------------------------------------------------------
  {
    id: 'business-presentation',
    name: 'Business Presentation',
    category: 'Business',
    style: 'Corporate',
    description: '10-slide executive pitch deck for startups, venture proposals, market opportunity, and business models.',
    slideCount: 10,
    iconName: 'Briefcase',
    accentColor: '#0284C7',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    slides: [
      {
        slideNumber: 1,
        title: 'Company & Venture Pitch Presentation',
        subtitle: 'Investor Pitch & Strategic Business Roadmap',
        bullets: [
          'Venture: StudentDoc Cloud Platform',
          'Founding Team: Executive Leadership & Engineering Leads',
          'Funding Round: Seed Stage Investment Proposal',
        ],
        layout: 'title',
        notes: 'Capture attention immediately with your company vision and one-line elevator pitch.',
      },
      {
        slideNumber: 2,
        title: 'The Market Problem',
        subtitle: 'Critical pain points experienced by millions of users',
        bullets: [
          'Academic and enterprise teams spend 40%+ of time on manual documentation and formatting',
          'Existing LMS platforms are clunky, outdated, and lack built-in generative AI capabilities',
          'Exam authoring and grading is labor-intensive, slow, and error-prone',
          'No unified workspace combining document synthesis, assessments, and keynotes',
        ],
        layout: 'content',
        notes: 'Explain the huge market problem in clear, compelling, financial terms.',
      },
      {
        slideNumber: 3,
        title: 'Our Solution & Value Proposition',
        subtitle: 'How StudentDoc transforms technical documentation',
        bullets: [
          'AI-Powered Studio: Formulate multi-page specifications and reports in seconds',
          'Classroom Assessment Engine: AI-generated MCQs with automated 00:00 submission',
          'Privacy-First Architecture: Role-based submitter visibility and secure cloud vault',
          'Omnichannel Delivery: Seamless web platform and native Android mobile application',
        ],
        layout: 'split',
        notes: 'Showcase your solution as the definitive answer to the market problem.',
      },
      {
        slideNumber: 4,
        title: 'Market Opportunity & TAM',
        subtitle: 'Total Addressable Market and growth drivers',
        bullets: [
          'Total Addressable Market (TAM): $14.2B Global EdTech & Document Software market',
          'Serviceable Addressable Market (SAM): $3.8B Higher Education & Academic institutions',
          'Serviceable Obtainable Market (SOM): $450M Tech colleges and corporate learning hubs',
          'Market CAGR: Growing at 18.5% year-over-year fueled by AI adoption',
        ],
        layout: 'stats',
        notes: 'Back up your market size with reliable data and clear CAGR growth drivers.',
      },
      {
        slideNumber: 5,
        title: 'Product Features & Capabilities',
        subtitle: 'Core product pillars driving user retention',
        bullets: [
          'Intelligent AI Document Studio with local/classroom reference grounding',
          'Interactive Classroom Hub with instant Join Codes and member rosters',
          'Real-Time MCQ Examination Studio with instant grading and faculty analytics',
          '1-Click Export to PDF, Word DOCX, and Keynote PPTX formats',
        ],
        layout: 'content',
        notes: 'Highlight your top 4 product pillars and competitive differentiators.',
      },
      {
        slideNumber: 6,
        title: 'Business & Monetization Model',
        subtitle: 'Multiple diversified revenue streams',
        bullets: [
          'Freemium B2C: Free access with basic generation; $9.99/mo Pro tier for power users',
          'Institutional B2B SaaS: $4.50 per student/month for universities and colleges',
          'Enterprise Licensing: Custom cloud Groq LPU AI deployments for corporate training',
          'High-Speed AI Inference: Ultra-low latency generation via Groq Cloud models',
        ],
        layout: 'split',
        notes: 'Explain how the company generates predictable recurring revenue.',
      },
      {
        slideNumber: 7,
        title: 'Competitive Advantage & Moat',
        subtitle: 'Why StudentDoc wins against legacy alternatives',
        bullets: [
          'High-Speed Groq Cloud AI: Sub-500ms inference via dedicated LPU architecture',
          'Sub-Second Performance: Next.js 14 edge architecture vs. legacy monolithic LMS',
          'Unified Workflow: Documents, Exams, and Slides in a single integrated account',
          'Zero-Lockin Exports: Native editable DOCX, PPTX, and PDF file downloads',
        ],
        layout: 'split',
        notes: 'Demonstrate your sustainable competitive advantage and defensive moat.',
      },
      {
        slideNumber: 8,
        title: 'Go-To-Market & Growth Strategy',
        subtitle: 'Customer acquisition and expansion roadmap',
        bullets: [
          'Phase 1: Grassroots viral adoption among university student cohorts and professors',
          'Phase 2: Department-wide institutional pilots with top engineering colleges',
          'Phase 3: EdTech channel partnerships and LMS integration marketplaces',
          'Target CAC: < $18 with LTV of $240+ (13.3x LTV/CAC ratio)',
        ],
        layout: 'content',
        notes: 'Detail your customer acquisition strategy and viral growth loops.',
      },
      {
        slideNumber: 9,
        title: 'Financial Projections & Milestones',
        subtitle: '3-year revenue forecasts and key operational targets',
        bullets: [
          'Year 1: 50,000 Active Users • $420,000 ARR • 15 College Partnerships',
          'Year 2: 250,000 Active Users • $2.4M ARR • Cash Flow Positive',
          'Year 3: 1,000,000 Active Users • $9.8M ARR • International Market Expansion',
          'Gross Margins: 84%+ enabled by low-cost self-hosted AI compute infrastructure',
        ],
        layout: 'stats',
        notes: 'Walk through realistic 3-year financial projections and unit economics.',
      },
      {
        slideNumber: 10,
        title: 'Investment Ask & Conclusion',
        subtitle: 'Funding requirements and capital allocation',
        bullets: [
          'Seeking: $750,000 Seed Capital for 15% Equity',
          'Allocation: 50% Engineering & AI R&D, 30% Growth & Sales, 20% Operations',
          'Vision: Build the world\'s most accessible academic intelligence workspace',
          'Thank you! We invite you to join us on this journey.',
        ],
        layout: 'conclusion',
        notes: 'State the investment ask clearly and close the pitch with energy.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 7. Internship Presentation (10 slides)
  // -------------------------------------------------------------
  {
    id: 'internship-presentation',
    name: 'Internship Presentation',
    category: 'Professional',
    style: 'Corporate',
    description: '10-slide internship review presentation covering organization profile, tasks completed, projects delivered, and skills learned.',
    slideCount: 10,
    iconName: 'Building',
    accentColor: '#0D9488',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    slides: [
      {
        slideNumber: 1,
        title: 'Internship Experience Presentation',
        subtitle: 'Software Engineering Internship Summary & Deliverables',
        bullets: [
          'Intern Name: Software Engineering Intern',
          'Host Organization: Tech Innovations Pvt. Ltd.',
          'Internship Duration: 12 Weeks (Summer / Fall Session)',
        ],
        layout: 'title',
        notes: 'Introduce yourself, the host organization, and your internship period.',
      },
      {
        slideNumber: 2,
        title: 'Introduction & Personal Background',
        subtitle: 'Academic background, interests, and internship role',
        bullets: [
          'Pre-final year Computer Science & Engineering undergraduate',
          'Joined the Core Platform Engineering Team as a Full-Stack Software Intern',
          'Primary Role: Developing serverless API endpoints and responsive React interfaces',
          'Mentor / Reporting Manager: Lead Software Architect',
        ],
        layout: 'content',
        notes: 'Provide context on your background and your role within the company.',
      },
      {
        slideNumber: 3,
        title: 'Organization Profile & Team Structure',
        subtitle: 'Overview of the company, mission, and department',
        bullets: [
          'Company Focus: Enterprise cloud platforms and AI automation solutions',
          'Global Presence: Serving 100+ clients across 12 countries',
          'Engineering Culture: Agile/Scrum sprints, daily standups, and CI/CD pipelines',
          'Team Structure: Cross-functional pod consisting of 6 engineers, PM, and QA',
        ],
        layout: 'split',
        notes: 'Briefly introduce the company culture and your engineering team.',
      },
      {
        slideNumber: 4,
        title: 'Internship Objectives & Goals',
        subtitle: 'Agreed learning targets and deliverables',
        bullets: [
          'Goal 1: Master modern Next.js 14 App Router and TypeScript best practices',
          'Goal 2: Design and implement secure RESTful backend APIs with Prisma ORM',
          'Goal 3: Write comprehensive unit test suites achieving > 85% code coverage',
          'Goal 4: Deploy and monitor production features on Vercel and cloud environments',
        ],
        layout: 'content',
        notes: 'Enumerate the concrete learning goals established at the start of the internship.',
      },
      {
        slideNumber: 5,
        title: 'Technologies & Tools Utilized',
        subtitle: 'Development stack and workflow tooling',
        bullets: [
          'Languages & Frameworks: TypeScript, React 18, Next.js 14, Flutter, Dart',
          'Databases & Backend: PostgreSQL, Supabase, Prisma ORM, Node.js',
          'Testing & CI/CD: Vitest, Jest, GitHub Actions, Docker, Vercel Edge',
          'Collaboration: Git, Jira, Figma, Slack, Postman API testing suite',
        ],
        layout: 'stats',
        notes: 'Show the depth and breadth of modern tools you used daily.',
      },
      {
        slideNumber: 6,
        title: 'Work & Tasks Completed',
        subtitle: 'Summary of daily engineering contributions',
        bullets: [
          'Sprint 1-4: Developed reusable UI components and interactive exam timer widgets',
          'Sprint 5-8: Built backend API routes for classroom creation and join codes',
          'Sprint 9-10: Implemented multi-format export engines (PDF, DOCX, PPTX)',
          'Sprint 11-12: Conducted bug fixes, performance audits, and release packaging',
        ],
        layout: 'content',
        notes: 'Break down your tasks across sprints to demonstrate structured progress.',
      },
      {
        slideNumber: 7,
        title: 'Projects Delivered & Impact',
        subtitle: 'Key software systems developed and launched',
        bullets: [
          'Project 1: Classroom MCQ Test Studio with automated server-side grading',
          'Project 2: Grounded AI Document Studio with reference material import',
          'Project 3: Flutter Mobile Application compiled into release APK (54.7 MB)',
          'Impact: Reduced test creation time by 80% and improved student engagement',
        ],
        layout: 'split',
        notes: 'Highlight your primary project deliverables and quantitative impact.',
      },
      {
        slideNumber: 8,
        title: 'Technical & Soft Skills Learned',
        subtitle: 'Professional growth and acquired capabilities',
        bullets: [
          'Technical: Serverless architecture, relational database indexing, state management',
          'Code Quality: Strict type-safety, modular abstraction, automated regression testing',
          'Communication: Cross-team sprint demos, technical documentation writing',
          'Problem Solving: Debugging production race conditions and memory optimizations',
        ],
        layout: 'stats',
        notes: 'Reflect on both technical competencies and soft skills developed.',
      },
      {
        slideNumber: 9,
        title: 'Challenges Encountered & Solutions',
        subtitle: 'Hurdles faced and lessons learned',
        bullets: [
          'Challenge: Managing real-time exam countdown across mobile app lifecycles\n→ Solved by synchronizing epoch timestamps with Supabase backend state',
          'Challenge: Handling low-latency generation on complex technical documents\n→ Solved by integrating high-speed Groq LPU Cloud service layer',
          'Key Takeaway: Resilient software requires proactive fallback mechanisms',
        ],
        layout: 'split',
        notes: 'Share honest engineering hurdles and how you successfully resolved them.',
      },
      {
        slideNumber: 10,
        title: 'Outcomes, Acknowledgments & Conclusion',
        subtitle: 'Final reflections and thank you message',
        bullets: [
          'Successfully fulfilled all internship requirements with high distinction',
          'Delivered production code running live for active users',
          'Sincere thanks to my mentor, engineering team, and faculty advisors',
          'Floor is now open for questions and feedback.',
        ],
        layout: 'conclusion',
        notes: 'Express sincere gratitude to your team and conclude your presentation.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 8. Project Proposal (10 slides)
  // -------------------------------------------------------------
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    category: 'Professional',
    style: 'Corporate',
    description: '10-slide project proposal presentation with problem statement, proposed solution, scope, timeline, and ROI.',
    slideCount: 10,
    iconName: 'FileSpreadsheet',
    accentColor: '#EA580C',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    slides: [
      {
        slideNumber: 1,
        title: 'Project Proposal Title',
        subtitle: 'Formal Engineering & Business Case Proposal',
        bullets: [
          'Prepared by: Project Proposal Team',
          'Submitted to: Technical Evaluation Committee / Executive Sponsor',
          'Proposal Date: Fiscal Year Planning Review',
        ],
        layout: 'title',
        notes: 'State the proposal title clearly and address the evaluation committee.',
      },
      {
        slideNumber: 2,
        title: 'Project Background & Context',
        subtitle: 'Current environment and strategic alignment',
        bullets: [
          'Background of current operations and digital transformation initiatives',
          'Alignment with core organizational goals and academic excellence targets',
          'Identification of operational bottlenecks in existing software tools',
          'Why this initiative is critical for near-term competitive positioning',
        ],
        layout: 'content',
        notes: 'Provide executive context on why this project is being proposed now.',
      },
      {
        slideNumber: 3,
        title: 'Problem Statement & Opportunity',
        subtitle: 'The unmet need and opportunity cost of inaction',
        bullets: [
          'Manual documentation workflows consume excessive hours and cause errors',
          'Disparate tools lead to fragmented data and security vulnerabilities',
          'Opportunity: Consolidate document synthesis, testing, and slides into one hub',
          'Cost of Inaction: Continued loss of productivity and high software subscription costs',
        ],
        layout: 'content',
        notes: 'Quantify the problem and explain the cost of doing nothing.',
      },
      {
        slideNumber: 4,
        title: 'Proposed Solution & Deliverables',
        subtitle: 'What we will build and deliver',
        bullets: [
          'Deliverable 1: Cloud-native Web Application deployed on modern serverless edge',
          'Deliverable 2: Cross-platform Flutter Mobile Application for Android & iOS',
          'Deliverable 3: AI Engine integrating Groq Cloud LPU models with sub-500ms inference',
          'Deliverable 4: Comprehensive documentation, test suites, and admin portal',
        ],
        layout: 'split',
        notes: 'Present the four core deliverables clearly and concretely.',
      },
      {
        slideNumber: 5,
        title: 'Goals & Specific Objectives',
        subtitle: 'SMART metrics for project success',
        bullets: [
          'Specific: Build all 7 studios with 100% feature completion',
          'Measurable: Achieve < 200ms API response time and 99.9% uptime',
          'Achievable: Leverage proven full-stack stack (Next.js, Supabase, Flutter)',
          'Relevant & Time-bound: Launch initial MVP within 12 weeks of approval',
        ],
        layout: 'content',
        notes: 'Demonstrate that your project goals are SMART and realistic.',
      },
      {
        slideNumber: 6,
        title: 'Project Scope & Boundaries',
        subtitle: 'In-scope features vs. future out-of-scope phases',
        bullets: [
          'In-Scope: User auth, classrooms, MCQ exam builder, document studio, PPT export',
          'In-Scope: Multi-format exports (PDF, DOCX, PPTX), student submission privacy',
          'Out-of-Scope (Phase 2): Real-time biometric proctoring and video streaming',
          'Boundary: Supports modern web browsers and Android 5.0+ devices',
        ],
        layout: 'split',
        notes: 'Clarify boundaries to prevent scope creep and manage stakeholder expectations.',
      },
      {
        slideNumber: 7,
        title: 'Methodology & Execution Strategy',
        subtitle: 'Agile development phases and quality gates',
        bullets: [
          'Agile Scrum Framework: 2-week sprint cycles with continuous integration',
          'Quality Assurance: Mandatory automated unit and regression test suites',
          'Security Review: Supabase Row-Level Security and JWT token encryption',
          'User Acceptance Testing: Beta cohort feedback loops before production rollout',
        ],
        layout: 'content',
        notes: 'Describe your development workflow and governance procedures.',
      },
      {
        slideNumber: 8,
        title: 'Project Timeline & Milestones',
        subtitle: 'Gantt schedule across 12-week execution lifecycle',
        bullets: [
          'Weeks 1-3: Requirements finalization, database schema & auth setup',
          'Weeks 4-7: Core studio development (Classrooms, MCQ Engine, Document Studio)',
          'Weeks 8-10: Flutter mobile app implementation and AI service integration',
          'Weeks 11-12: Full regression testing, documentation, and production launch',
        ],
        layout: 'stats',
        notes: 'Walk through key milestones and deliverable checkpoints.',
      },
      {
        slideNumber: 9,
        title: 'Expected Results & Return on Investment',
        subtitle: 'Quantitative and qualitative organizational impact',
        bullets: [
          '70% reduction in time spent creating documents and grading examinations',
          'Ultra-fast sub-500ms inference via dedicated Groq Cloud LPU deployment',
          'Single unified platform replacing 3+ fragmented legacy subscriptions',
          'Positive ROI achieved within 4 months of full institutional deployment',
        ],
        layout: 'stats',
        notes: 'Highlight the strong business case and positive ROI.',
      },
      {
        slideNumber: 10,
        title: 'Conclusion & Approval Sign-off',
        subtitle: 'Final summary and authorization request',
        bullets: [
          'The proposal provides a high-impact, low-risk, modern technological solution',
          'Team, tooling, architecture, and budget plans are fully established',
          'Requesting formal stakeholder approval to initiate Sprint 1 development',
          'Thank you! Open for questions and discussion.',
        ],
        layout: 'conclusion',
        notes: 'Ask for formal project authorization and open the floor for questions.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 9. Technical Presentation (10 slides)
  // -------------------------------------------------------------
  {
    id: 'technical-presentation',
    name: 'Technical Presentation',
    category: 'Professional',
    style: 'Technical',
    description: '10-slide engineering presentation with system architecture, runtime ecosystem, algorithms, code workflow, and benchmarks.',
    slideCount: 10,
    iconName: 'Cpu',
    accentColor: '#06B6D4',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    slides: [
      {
        slideNumber: 1,
        title: 'Deep-Dive Technical Architecture',
        subtitle: 'System Engineering, Distributed Runtime & Microservices',
        bullets: [
          'Topic: Full-Stack Architecture of StudentDoc Cloud Engine',
          'Lead Systems Architect: Principal Software Engineer',
          'Engineering Tech Brief: Next.js 14, Supabase, Flutter & Groq Cloud',
        ],
        layout: 'title',
        notes: 'Introduce the technical presentation and state the engineering scope.',
      },
      {
        slideNumber: 2,
        title: 'Executive Technical Overview',
        subtitle: 'High-throughput full-stack software topology',
        bullets: [
          'Unified monorepo structure housing web services and mobile application',
          'Serverless API runtime with sub-50ms cold-start response latencies',
          'Relational database managed through declarative Prisma schema migrations',
          'Self-hosted AI inference layer routing tasks between llama3.2 and qwen2.5',
        ],
        layout: 'content',
        notes: 'Summarize the technical design principles and topology.',
      },
      {
        slideNumber: 3,
        title: 'System Architecture & Component Diagram',
        subtitle: 'Tiered client-server-database communication model',
        bullets: [
          'Client Tier: Next.js 14 React Server Components + Flutter Mobile Client',
          'Gateway Tier: Vercel Edge Middleware handling JWT verification and CORS',
          'Service Tier: 39 RESTful Serverless Functions with Zod validation',
          'Storage Tier: PostgreSQL with Supabase RLS and Prisma connection pool',
        ],
        layout: 'split',
        notes: 'Walk through your component diagram and explain communication protocols.',
      },
      {
        slideNumber: 4,
        title: 'Technologies & Runtime Ecosystem',
        subtitle: 'Core toolchain and runtime dependencies',
        bullets: [
          'TypeScript & Node.js 20: Type-safe serverless backend and full-stack modules',
          'Next.js 14 App Router: Server Components, dynamic streaming, and edge caching',
          'PostgreSQL 15 & Prisma ORM: ACID compliant relational persistence',
          'Groq Cloud LLM Engine: High-speed inference engine running llama-3.3-70b-versatile',
        ],
        layout: 'stats',
        notes: 'Explain your choice of technologies and modern architectural patterns.',
      },
      {
        slideNumber: 5,
        title: 'Core Concepts & Design Patterns',
        subtitle: 'Architectural patterns implemented across the codebase',
        bullets: [
          'Repository & Service Pattern: Encapsulated business logic and data access',
          'Task-Based Model Routing: Task determination between document and quiz engines',
          'Zero-Failure Resilience: Deterministic offline synthesis fallbacks',
          'Role-Based Access Control: Strict instructor vs. student visibility isolation',
        ],
        layout: 'content',
        notes: 'Highlight engineering design patterns that keep code maintainable.',
      },
      {
        slideNumber: 6,
        title: 'Implementation Details & Algorithms',
        subtitle: 'Algorithmic state handling and database transactions',
        bullets: [
          '6-Character Unique Code Generator with collision retry mechanism',
          'Strict JSON extraction and schema validation for AI generated arrays',
          'Server-side exam scoring engine: score = sum(q.marks if chosen == correct)',
          'Client-side binary compilation for PPTX and DOCX without server overhead',
        ],
        layout: 'split',
        notes: 'Explain key algorithms and complex state transitions in detail.',
      },
      {
        slideNumber: 7,
        title: 'Code Walkthrough & Workflow Pipeline',
        subtitle: 'Step-by-step request execution path',
        bullets: [
          'Step 1: Client submits request with JWT bearer token header',
          'Step 2: Middleware validates Supabase session and attaches user context',
          'Step 3: Route handler executes Zod validation and invokes central service',
          'Step 4: Database query executed via Prisma and clean JSON returned',
        ],
        layout: 'content',
        notes: 'Trace a sample request from browser click down to the database record.',
      },
      {
        slideNumber: 8,
        title: 'Testing, Benchmarks & Validation',
        subtitle: 'Quality assurance and regression testing suites',
        bullets: [
          '48 automated test suites containing 490 individual unit and API tests',
          '100% test pass rate across authentication, CRUD, exams, and exports',
          'Load testing validated under 250 concurrent requests with 0% dropped packets',
          'Automated CI/CD validation on GitHub Actions with next build verification',
        ],
        layout: 'stats',
        notes: 'Present test results, coverage metrics, and build validation stats.',
      },
      {
        slideNumber: 9,
        title: 'Performance Optimization & Benchmarks',
        subtitle: 'Measured latencies and resource optimization',
        bullets: [
          'Prisma Connection Pooling: Reduced database query overhead by 65%',
          'Tree-Shaking: Font asset size reduced from 1.64MB to 15KB (99.1% reduction)',
          'Next.js Route Optimization: 28 static/dynamic routes compiled in < 60s',
          'APK Compression: Release bundle optimized to 54.7MB with ProGuard shrinking',
        ],
        layout: 'stats',
        notes: 'Highlight specific quantitative optimizations and latency benchmarks.',
      },
      {
        slideNumber: 10,
        title: 'Conclusion & Technical Q&A',
        subtitle: 'Summary of engineering accomplishments and open floor',
        bullets: [
          'Delivered an extensible, high-performance, and secure full-stack platform',
          'Achieved instant sub-500ms response times through Groq Cloud LPU acceleration',
          'Cross-platform codebase ready for immediate enterprise and college deployment',
          'Thank you! Open for technical questions and architectural discussions.',
        ],
        layout: 'conclusion',
        notes: 'Conclude technical presentation and invite questions from fellow engineers.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 10. Simple Professional (6 slides)
  // -------------------------------------------------------------
  {
    id: 'simple-professional',
    name: 'Simple Professional',
    category: 'Professional',
    style: 'Minimal',
    description: 'Clean, elegant, 6-slide minimalist keynote template for quick briefings, status reviews, and executive updates.',
    slideCount: 6,
    iconName: 'Sparkles',
    accentColor: '#64748B',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    slides: [
      {
        slideNumber: 1,
        title: 'Executive Project & Status Briefing',
        subtitle: 'High-Level Overview & Strategic Progress Update',
        bullets: [
          'Presenter: Project Lead & Executive Team',
          'Meeting: Quarterly Review & Milestone Briefing',
          'Status: On Track • All Objectives Satisfied',
        ],
        layout: 'title',
        notes: 'Welcome stakeholders and state the purpose of this brief executive update.',
      },
      {
        slideNumber: 2,
        title: 'Executive Overview',
        subtitle: 'High-level summary of goals, scope, and direction',
        bullets: [
          'Core Focus: Streamlining technical documentation and examination workflows',
          'Key Milestone: Completed full-stack web and mobile application deployment',
          'User Impact: Substantial time savings and improved academic collaboration',
          'Operational Health: Systems running with 99.9% uptime and zero critical bugs',
        ],
        layout: 'content',
        notes: 'Provide a concise overview of progress since the last review.',
      },
      {
        slideNumber: 3,
        title: 'Key Points & Strategic Focus',
        subtitle: 'Core pillars driving current execution',
        bullets: [
          'Pillar A - Product Excellence: Intuitive, responsive, and accessible UI across devices',
          'Pillar B - Cost Optimization: Centralized self-hosted AI engine with zero API fees',
          'Pillar C - Security & Privacy: Role-based access control and encrypted persistence',
          'Pillar D - Multi-Format Export: Native PPTX, DOCX, and PDF binary compilation',
        ],
        layout: 'split',
        notes: 'Discuss the 4 main focus pillars and why they matter strategically.',
      },
      {
        slideNumber: 4,
        title: 'Detailed Insights & Execution',
        subtitle: 'Progress on deliverables and milestones',
        bullets: [
          'Classroom Hub: Complete with 6-char join codes and student submission privacy',
          'MCQ Examination Engine: Fully tested with countdown timers and auto-scoring',
          'Document Studio: Integrated with reference grounding and multi-page formatting',
          'Mobile Deployment: Release APK compiled and verified on Android devices',
        ],
        layout: 'content',
        notes: 'Provide concrete details on what has been built and delivered.',
      },
      {
        slideNumber: 5,
        title: 'Results, Metrics & Impact',
        subtitle: 'Measured outcomes and verified benchmarks',
        bullets: [
          '490/490 unit and integration tests passing with 100% success rate',
          'Sub-200ms average API latency across all 39 serverless endpoints',
          '70% reduction in document creation and examination grading time',
          'Zero ongoing LLM API subscription expenses for the organization',
        ],
        layout: 'stats',
        notes: 'Share hard quantitative metrics demonstrating successful delivery.',
      },
      {
        slideNumber: 6,
        title: 'Conclusion & Next Steps',
        subtitle: 'Final summary and immediate next actions',
        bullets: [
          'All project requirements and quality criteria successfully delivered',
          'Immediate Next Step: Roll out to initial beta user cohorts',
          'Feedback & continuous improvement iterations scheduled for next sprint',
          'Thank you! Open for comments and discussion.',
        ],
        layout: 'conclusion',
        notes: 'Conclude the briefing and open the floor for executive questions.',
      },
    ],
  },
];

/**
 * Find a presentation template by its ID
 */
export function getPresentationTemplateById(id: string): PresentationTemplateItem | undefined {
  return DEFAULT_PRESENTATION_TEMPLATES.find((t) => t.id === id);
}

/**
 * Instantiates a fully functional SlideItem[] deck from a template
 */
export function createDeckFromTemplate(templateId: string, customTitle?: string): {
  title: string;
  style: PresentationStyle;
  slides: SlideItem[];
} {
  const template = getPresentationTemplateById(templateId) || DEFAULT_PRESENTATION_TEMPLATES[0];
  const deckTitle = customTitle && customTitle.trim().length > 0
    ? customTitle.trim()
    : template.name;

  const slides: SlideItem[] = template.slides.map((s, idx) => ({
    id: `slide-${Date.now()}-${idx + 1}`,
    slideNumber: s.slideNumber,
    title: idx === 0 ? deckTitle : s.title,
    subtitle: s.subtitle,
    bullets: [...s.bullets],
    layout: s.layout,
    notes: s.notes,
    chartOrTable: s.chartOrTable,
  }));

  return {
    title: deckTitle,
    style: template.style,
    slides,
  };
}
