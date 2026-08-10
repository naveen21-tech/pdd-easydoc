'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderGit2,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Code2,
  Database,
  Cpu,
  Boxes,
  Loader2,
  Check,
  RotateCcw,
  BookOpen,
  Settings2,
  ChevronRight,
  Download,
  Eye,
  Zap,
} from 'lucide-react';
import { ProjectModuleItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

const AVAILABLE_DOC_TYPES = [
  { id: 'Project Report', label: 'Project Report', desc: 'Complete executive summary, methodology, and outcome report' },
  { id: 'SRS', label: 'SRS (Software Requirements Spec)', desc: 'Functional, non-functional requirements and use case definitions' },
  { id: 'Software Design Document', label: 'Software Design Document', desc: 'High-level component diagrams, data flow, and patterns' },
  { id: 'System Architecture', label: 'System Architecture', desc: 'Tiered client-server topology and infrastructure specs' },
  { id: 'Database Design', label: 'Database Design & Schema', desc: 'Relational schema, 3NF tables, ER models, and constraints' },
  { id: 'API Documentation', label: 'REST API Documentation', desc: 'Endpoints, request schemas, status codes, and auth headers' },
  { id: 'Test Plan', label: 'Test Plan & Strategy', desc: 'QA scopes, environments, and automated testing criteria' },
  { id: 'Test Cases', label: 'Test Cases Matrix', desc: 'Pass/Fail test steps, assertions, and verification criteria' },
  { id: 'User Manual', label: 'User Manual & Guide', desc: 'End-user operational walkthrough and GUI instructions' },
  { id: 'Installation Guide', label: 'Installation & Deployment', desc: 'Prerequisites, environment setup, and deployment commands' },
  { id: 'Future Enhancements', label: 'Future Scope & Enhancements', desc: 'Roadmap, AI upgrades, and scalability projections' },
  { id: 'Conclusion & References', label: 'Conclusion & References', desc: 'Summary of findings, bibliographies, and citations' },
];

const PROJECT_PRESETS = [
  {
    name: 'E-Commerce Microservices Cloud Platform',
    domain: 'Cloud Computing & Distributed Systems',
    description: 'High-availability containerized microservices platform with event-driven message queuing, Redis caching, stripe payment gateways, and automated load balancing.',
    problemStatement: 'Monolithic legacy systems struggle with traffic spikes, cascading service failures, and high deployment downtimes during peak sale periods.',
    objectives: 'Achieve sub-200ms p95 latency, 99.99% availability, automated horizontal scaling, and isolated fault domains across independent microservices.',
    targetUsers: 'Online Shoppers, Platform Sellers, Warehouse Operators, and System Administrators.',
    languages: 'TypeScript, Go, SQL',
    frameworks: 'Next.js 14, NestJS, Tailwind CSS',
    database: 'PostgreSQL, Redis, RabbitMQ',
    tools: 'Docker, Kubernetes, GitHub Actions, AWS',
    modules: [
      {
        id: 'mod-1',
        name: 'Identity & Authentication Service',
        description: 'Stateless JWT cookie sessions, OAuth2 login, and role-based permissions.',
        features: ['User Registration', 'MFA Login', 'Token Refresh', 'RBAC Middleware'],
        userRole: 'All Users',
      },
      {
        id: 'mod-2',
        name: 'Order Processing & Payment Gateway',
        description: 'Transactional shopping cart management, Stripe checkout, and invoice generation.',
        features: ['Cart Synchronization', 'Stripe Webhooks', 'Order Tracking', 'Refund Handlers'],
        userRole: 'Customer',
      },
      {
        id: 'mod-3',
        name: 'Inventory & Warehouse Dispatch',
        description: 'Real-time stock reservation, SKU tracking, and automated fulfillment dispatches.',
        features: ['Stock Level Alerts', 'SKU Management', 'Dispatch Logging', 'Supplier Sync'],
        userRole: 'Warehouse Operator',
      },
    ],
  },
  {
    name: 'AI Healthcare Diagnostic & EHR System',
    domain: 'Healthcare Informatics & Applied AI',
    description: 'HIPAA-compliant hospital management platform featuring deep learning medical scan classification, FHIR-standard patient records, and real-time vital telemetry.',
    problemStatement: 'Diagnostic backlogs, siloed medical records, and manual triage delays increase critical patient wait times by up to 45%.',
    objectives: 'Provide sub-second AI diagnostic recommendations, guarantee 100% HIPAA compliance, and synchronize EHR records seamlessly across departments.',
    targetUsers: 'Chief Medical Officers, Radiologists, Attending Nurses, and Registered Patients.',
    languages: 'Python, TypeScript, SQL',
    frameworks: 'Next.js 14, FastAPI, PyTorch',
    database: 'PostgreSQL, pgvector, Redis',
    tools: 'Docker, CUDA, Vercel, Git',
    modules: [
      {
        id: 'mod-1',
        name: 'Patient EHR & Triage Management',
        description: 'Encrypted patient records, demographic history, and digital triage intake.',
        features: ['Patient Intake', 'Vital Signs Log', 'Medical History', 'Doctor Allocation'],
        userRole: 'Hospital Staff',
      },
      {
        id: 'mod-2',
        name: 'AI Radiographic Image Analyzer',
        description: 'Convolutional neural network inference for chest X-ray and MRI scan segmentation.',
        features: ['DICOM Image Upload', 'Anomaly Detection', 'Confidence Score', 'Doctor Sign-off'],
        userRole: 'Radiologist',
      },
      {
        id: 'mod-3',
        name: 'Telemedicine & Prescription Portal',
        description: 'Real-time WebRTC video consultations and digitally signed e-prescriptions.',
        features: ['Video Consultation', 'E-Prescription', 'Pharmacy Dispatch', 'Billing Sync'],
        userRole: 'Doctor & Patient',
      },
    ],
  },
];

export default function ProjectDocsPage() {
  const router = useRouter();

  // Wizard Step (1: Info, 2: Modules, 3: Docs, 4: Progress / Done)
  const [step, setStep] = useState<number>(1);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);

  // Step 1 State: Project Information
  const [projectName, setProjectName] = useState('Distributed Cloud Systems Architecture');
  const [projectDomain, setProjectDomain] = useState('Web & Cloud Enterprise');
  const [projectDescription, setProjectDescription] = useState('High-availability, fault-tolerant microservices platform featuring event-driven messaging, distributed caching, and zero-downtime deployments.');
  const [problemStatement, setProblemStatement] = useState('Monolithic legacy architectures fail to scale horizontally under unpredictable peak traffic.');
  const [objectives, setObjectives] = useState('Achieve sub-second latency, zero-loss transaction consistency, and seamless horizontal auto-scaling.');
  const [targetUsers, setTargetUsers] = useState('Software Engineers, DevOps Architects, and Enterprise Stakeholders');

  // Tech Stack Tags
  const [languages, setLanguages] = useState('TypeScript, Python, SQL');
  const [frameworks, setFrameworks] = useState('Next.js 14, React, Node.js');
  const [database, setDatabase] = useState('PostgreSQL, Supabase, Redis');
  const [tools, setTools] = useState('Git, Docker, Vercel, VS Code');

  // Step 2 State: Modules
  const [modules, setModules] = useState<ProjectModuleItem[]>([
    {
      id: 'mod-1',
      name: 'User Authentication & RBAC',
      description: 'Cookie session handling, Supabase auth, and role-based route guards.',
      features: ['Sign up', 'Login', 'Password Reset', 'Role Guard'],
      userRole: 'All Users',
    },
    {
      id: 'mod-2',
      name: 'Core Application Engine',
      description: 'Business logic controllers with transactional database pooling.',
      features: ['Task Pipeline', 'Event Broker', 'Stateful Cache'],
      userRole: 'Standard User',
    },
    {
      id: 'mod-3',
      name: 'Governance & Analytics Console',
      description: 'System audit logs, API telemetry metrics, and user management.',
      features: ['Audit Logs', 'Latency Analytics', 'User Controls'],
      userRole: 'Administrator',
    },
  ]);

  // Step 3 State: Selected Documentation
  const [selectedDocs, setSelectedDocs] = useState<string[]>([
    'Project Report',
    'SRS',
    'System Architecture',
    'Database Design',
    'API Documentation',
    'Test Cases',
    'User Manual',
  ]);

  // Step 4 State: Live Progress Simulation
  const [generating, setGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<{ label: string; status: 'pending' | 'in-progress' | 'completed' }[]>([]);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchExistingProjects();
  }, []);

  const fetchExistingProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjectsList(data.projects || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleApplyPreset = (preset: typeof PROJECT_PRESETS[0]) => {
    setProjectName(preset.name);
    setProjectDomain(preset.domain);
    setProjectDescription(preset.description);
    setProblemStatement(preset.problemStatement);
    setObjectives(preset.objectives);
    setTargetUsers(preset.targetUsers);
    setLanguages(preset.languages);
    setFrameworks(preset.frameworks);
    setDatabase(preset.database);
    setTools(preset.tools);
    setModules(preset.modules);
  };

  const addModule = () => {
    const newId = `mod-${Date.now()}`;
    setModules([
      ...modules,
      {
        id: newId,
        name: 'New Feature Module',
        description: 'Module purpose and operational scope',
        features: ['Feature 1', 'Feature 2'],
        userRole: 'User',
      },
    ]);
  };

  const removeModule = (id: string) => {
    setModules(modules.filter((m) => m.id !== id));
  };

  const updateModule = (id: string, field: keyof ProjectModuleItem, value: any) => {
    setModules(
      modules.map((m) => {
        if (m.id === id) {
          return { ...m, [field]: value };
        }
        return m;
      })
    );
  };

  const toggleDocSelection = (docId: string) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter((d) => d !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  const handleSelectAllDocs = () => {
    setSelectedDocs(AVAILABLE_DOC_TYPES.map((d) => d.id));
  };

  const handleClearAllDocs = () => {
    setSelectedDocs([]);
  };

  // Start Generation
  const handleStartGeneration = async () => {
    if (!projectName.trim() || !projectDescription.trim()) {
      setErrorMsg('Please provide a project name and description in Step 1.');
      setStep(1);
      return;
    }
    if (selectedDocs.length === 0) {
      setErrorMsg('Please select at least one document to generate.');
      return;
    }

    setGenerating(true);
    setErrorMsg(null);
    setStep(4);

    const initialSteps = [
      { label: 'Processing project architecture & metadata...', status: 'in-progress' as const },
      { label: 'Analyzing software modules & requirements...', status: 'pending' as const },
      ...selectedDocs.map((doc) => ({
        label: `Synthesizing ${doc}...`,
        status: 'pending' as const,
      })),
      { label: 'Finalizing project workspace & assembling artifacts...', status: 'pending' as const },
    ];

    setGenerationSteps(initialSteps);

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      setGenerationSteps((prev) => {
        const next = [...prev];
        if (stepIndex < next.length) {
          if (stepIndex > 0) next[stepIndex - 1].status = 'completed';
          next[stepIndex].status = 'in-progress';
          stepIndex++;
        }
        return next;
      });
    }, 1200);

    try {
      const res = await fetch('/api/projects/documentation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          projectDomain,
          projectDescription,
          problemStatement,
          objectives,
          targetUsers,
          techStack: {
            languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
            frameworks: frameworks.split(',').map((s) => s.trim()).filter(Boolean),
            database: database.split(',').map((s) => s.trim()).filter(Boolean),
            tools: tools.split(',').map((s) => s.trim()).filter(Boolean),
          },
          modules,
          selectedDocTypes: selectedDocs,
        }),
      });

      clearInterval(progressInterval);

      if (res.ok) {
        const data = await res.json();
        setGenerationSteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
        setCreatedProjectId(data.projectId);
        fetchExistingProjects();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate documentation.');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setErrorMsg(err?.message || 'Error occurred during generation.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender px-3 py-1 rounded-full text-xs font-bold mb-2 border border-purple-200 dark:border-brand-lavender/30">
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Feature 1 • Project Documentation Generator</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Project Documentation Studio
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Turn your project specs into complete, submission-ready engineering documentation packages.
          </p>
        </div>

        <button
          onClick={() => {
            setStep(1);
            setCreatedProjectId(null);
          }}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Documentation</span>
        </button>
      </div>

      {/* Step Indicator Navigation */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
          <button
            onClick={() => !generating && setStep(1)}
            className={`p-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              step === 1
                ? 'bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border border-purple-300 dark:border-brand-lavender/40'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-hover'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center">1</span>
            <span>Project Info</span>
          </button>

          <button
            onClick={() => !generating && setStep(2)}
            className={`p-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              step === 2
                ? 'bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border border-purple-300 dark:border-brand-lavender/40'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-hover'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center">2</span>
            <span>Modules ({modules.length})</span>
          </button>

          <button
            onClick={() => !generating && setStep(3)}
            className={`p-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              step === 3
                ? 'bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border border-purple-300 dark:border-brand-lavender/40'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-hover'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center">3</span>
            <span>Artifacts ({selectedDocs.length})</span>
          </button>

          <button
            onClick={() => !generating && setStep(4)}
            className={`p-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              step === 4
                ? 'bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border border-purple-300 dark:border-brand-lavender/40'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-hover'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center">4</span>
            <span>Synthesize</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-800 dark:text-rose-300 font-semibold">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: Project Information */}
      {step === 1 && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6 animate-scale-in">
          {/* Preset Quick Fillers */}
          <div className="space-y-1.5 pb-2 border-b border-slate-100 dark:border-dark-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>1-Click Project Templates (Click to Pre-fill):</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {PROJECT_PRESETS.map((pr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(pr)}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-purple-200 dark:border-brand-lavender/30 bg-purple-50 dark:bg-brand-amethyst/30 hover:bg-purple-100 text-purple-900 dark:text-brand-lavender transition-all"
                >
                  {pr.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Distributed Cloud Architecture"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Domain / Industry *
              </label>
              <input
                type="text"
                value={projectDomain}
                onChange={(e) => setProjectDomain(e.target.value)}
                placeholder="e.g. Healthcare, E-Commerce, IoT"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Project Description *
            </label>
            <textarea
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Describe what the system does, key capabilities, and user value..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Problem Statement
              </label>
              <input
                type="text"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="What inefficiencies or challenges does this solve?"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Target Stakeholders / Users
              </label>
              <input
                type="text"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                placeholder="e.g. End-Users, Doctors, Admins"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Tech Stack Specs */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-dark-border">
            <h4 className="text-xs font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider">
              Technology Stack Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Languages</label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Frameworks</label>
                <input
                  type="text"
                  value={frameworks}
                  onChange={(e) => setFrameworks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Databases</label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">DevOps & Tools</label>
                <input
                  type="text"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center space-x-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all"
            >
              <span>Continue to Step 2: Modules</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Feature Modules */}
      {step === 2 && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6 animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Project Architecture Modules ({modules.length})
              </h3>
              <p className="text-xs text-slate-500">
                Define the structural components that make up your software system.
              </p>
            </div>
            <button
              onClick={addModule}
              className="inline-flex items-center space-x-1 bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-purple-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Module</span>
            </button>
          </div>

          <div className="space-y-4">
            {modules.map((m, idx) => (
              <div
                key={m.id || idx}
                className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/40 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-700 dark:text-brand-lavender">
                    Module #{idx + 1}
                  </span>
                  {modules.length > 1 && (
                    <button
                      onClick={() => removeModule(m.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      title="Remove Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => updateModule(m.id, 'name', e.target.value)}
                    placeholder="Module Name..."
                    className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={m.userRole}
                    onChange={(e) => updateModule(m.id, 'userRole', e.target.value)}
                    placeholder="User Role (e.g. Admin, Customer)..."
                    className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <textarea
                  rows={2}
                  value={m.description}
                  onChange={(e) => updateModule(m.id, 'description', e.target.value)}
                  placeholder="Module operational scope and technical requirements..."
                  className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-border">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Step 1</span>
            </button>

            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center space-x-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all"
            >
              <span>Continue to Step 3: Documents</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Documentation Artifacts Picker */}
      {step === 3 && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6 animate-scale-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3 gap-2">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Select Deliverable Artifacts ({selectedDocs.length} of {AVAILABLE_DOC_TYPES.length} Selected)
              </h3>
              <p className="text-xs text-slate-500">
                Choose the engineering documents to synthesize for this project package.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAllDocs}
                className="text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={handleClearAllDocs}
                className="text-xs font-bold text-slate-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AVAILABLE_DOC_TYPES.map((doc) => {
              const isSelected = selectedDocs.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocSelection(doc.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                    isSelected
                      ? 'border-purple-600 dark:border-brand-lavender bg-purple-50 dark:bg-brand-amethyst/50 ring-2 ring-purple-400/40 shadow-sm'
                      : 'border-slate-200 dark:border-dark-border hover:border-purple-300 bg-white dark:bg-dark-bg/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-xs text-slate-900 dark:text-white">
                        {doc.label}
                      </h4>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-brand-lavender shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {doc.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-border">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Step 2</span>
            </button>

            <button
              onClick={handleStartGeneration}
              disabled={selectedDocs.length === 0}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3 rounded-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Synthesize {selectedDocs.length} Engineering Artifacts</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Live Generation & Project Workspace Link */}
      {step === 4 && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-8 shadow-sm space-y-6 animate-scale-in text-center max-w-xl mx-auto">
          {generating ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 dark:text-brand-lavender mx-auto" />
              <div>
                <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                  Synthesizing Project Package...
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Generating professional, submission-grade engineering documents.
                </p>
              </div>

              {/* Progress Steps Feed */}
              <div className="space-y-2 text-left pt-4 max-h-60 overflow-y-auto pr-1">
                {generationSteps.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 text-xs py-1 px-3 rounded-lg bg-slate-50 dark:bg-dark-bg/60 border border-slate-100 dark:border-dark-border"
                  >
                    {s.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : s.status === 'in-progress' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span
                      className={`truncate ${
                        s.status === 'completed'
                          ? 'text-slate-800 dark:text-slate-200 font-semibold'
                          : s.status === 'in-progress'
                          ? 'text-purple-700 dark:text-brand-lavender font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                  Documentation Package Created!
                </h3>
                <p className="text-xs text-slate-500">
                  All {selectedDocs.length} engineering artifacts have been successfully synthesized.
                </p>
              </div>

              <div className="pt-2">
                {createdProjectId ? (
                  <Link
                    href={`/project-docs/${createdProjectId}`}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3 rounded-xl shadow-xl hover:scale-[1.02] transition-all"
                  >
                    <span>Open Project Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={() => router.push('/project-docs')}
                    className="inline-flex items-center space-x-2 bg-purple-700 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-md"
                  >
                    <span>View Projects</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing Projects History List */}
      {projectsList.length > 0 && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
            <FolderGit2 className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
            <span>Existing Project Workspaces ({projectsList.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectsList.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/40 flex flex-col justify-between space-y-3 hover:border-purple-400 transition-all"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-brand-lavender">
                    {p.domain}
                  </span>
                  <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {p.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {p.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-dark-border">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {p.documents?.length || 0} Documents
                  </span>

                  <Link
                    href={`/project-docs/${p.id}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
