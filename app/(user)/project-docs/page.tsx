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

export default function ProjectDocsPage() {
  const router = useRouter();

  // Wizard Step (1: Info, 2: Modules, 3: Docs, 4: Progress / Done)
  const [step, setStep] = useState<number>(1);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);

  // Step 1 State: Project Information
  const [projectName, setProjectName] = useState('');
  const [projectDomain, setProjectDomain] = useState('Web & Cloud Enterprise');
  const [projectDescription, setProjectDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [objectives, setObjectives] = useState('');
  const [targetUsers, setTargetUsers] = useState('');

  // Tech Stack Tags
  const [languages, setLanguages] = useState('TypeScript, Python, SQL');
  const [frameworks, setFrameworks] = useState('Next.js 14, React, Node.js');
  const [database, setDatabase] = useState('PostgreSQL, Supabase');
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
      name: 'Document Generation Studio',
      description: 'Multi-model AI document synthesis with live typography formatting.',
      features: ['AI Synthesis', 'Export to PDF/DOCX', 'Template Engine'],
      userRole: 'Standard User',
    },
    {
      id: 'mod-3',
      name: 'Admin Governance Console',
      description: 'System audit logs, AI token usage metrics, and user management.',
      features: ['Audit Logs', 'Latency Analytics', 'User Management'],
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
      { label: 'Processing project information & domain metadata...', status: 'in-progress' as const },
      { label: 'Analyzing software architecture and module breakdown...', status: 'pending' as const },
      ...selectedDocs.map((doc) => ({
        label: `Synthesizing ${doc}...`,
        status: 'pending' as const,
      })),
      { label: 'Finalizing project workspace & assembling artifacts...', status: 'pending' as const },
    ];

    setGenerationSteps(initialSteps);

    // Simulate animated step progression while API runs
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
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-purple-600 dark:bg-brand-purple text-white text-[10px] flex items-center justify-center">
              1
            </span>
            <span>Project Details</span>
          </button>

          <button
            onClick={() => !generating && setStep(2)}
            className={`p-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              step === 2
                ? 'bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border border-purple-300 dark:border-brand-lavender/40'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-purple-600 dark:bg-brand-purple text-white text-[10px] flex items-center justify-center">
              2
            </span>
            <span>Modules</span>
          </button>

          <button
            onClick={() => !generating && setStep(3)}
            className={`p-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              step === 3
                ? 'bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border border-purple-300 dark:border-brand-lavender/40'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-purple-600 dark:bg-brand-purple text-white text-[10px] flex items-center justify-center">
              3
            </span>
            <span>Select Docs ({selectedDocs.length})</span>
          </button>

          <button
            onClick={() => !generating && step === 4 && setStep(4)}
            className={`p-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              step === 4
                ? 'bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border border-purple-300 dark:border-brand-lavender/40'
                : 'text-slate-500 dark:text-slate-400 opacity-60'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-purple-600 dark:bg-brand-purple text-white text-[10px] flex items-center justify-center">
              4
            </span>
            <span>Generate & Export</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: PROJECT INFORMATION */}
      {step === 1 && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6 animate-scale-in">
          <div className="border-b border-slate-100 dark:border-dark-border pb-4">
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <Boxes className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
              <span>Step 1 — Project Information & Technologies</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Provide foundational information about your software system to prime the AI documentation engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. EasyDoc — AI Document Engine"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Project Domain / Industry *
              </label>
              <input
                type="text"
                value={projectDomain}
                onChange={(e) => setProjectDomain(e.target.value)}
                placeholder="e.g. EdTech, Healthcare, FinTech, SaaS, Cloud Automation"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Project Description *
              </label>
              <textarea
                rows={3}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Explain the comprehensive purpose, core problem solved, and end-to-end functionality..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Problem Statement
              </label>
              <textarea
                rows={2}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="What critical bottlenecks or inefficiency does this software resolve?"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Primary Objectives
              </label>
              <textarea
                rows={2}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Key measurable deliverables and goals..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Target Users / Stakeholders
              </label>
              <input
                type="text"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                placeholder="e.g. Students, Technical Leads, Enterprise End-Users, Review Boards"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tech Stack Matrix */}
          <div className="pt-4 border-t border-slate-100 dark:border-dark-border space-y-4">
            <h3 className="text-xs font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider flex items-center space-x-1.5">
              <Code2 className="w-4 h-4" />
              <span>Technology Stack & Development Tools</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Languages</span>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="TypeScript, Python, Java"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Frameworks</span>
                <input
                  type="text"
                  value={frameworks}
                  onChange={(e) => setFrameworks(e.target.value)}
                  placeholder="Next.js, React, Express"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Database</span>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder="PostgreSQL, Supabase"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Tools & CI/CD</span>
                <input
                  type="text"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  placeholder="Docker, Git, Vercel"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-dark-border">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center space-x-2 bg-purple-700 hover:bg-purple-800 dark:bg-brand-purple text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all"
            >
              <span>Continue to Step 2: Project Modules</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PROJECT MODULES */}
      {step === 2 && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6 animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
                <span>Step 2 — Project Modules & Components</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Define the modular breakdown of your application for precise SRS, API, and Architecture generation.
              </p>
            </div>

            <button
              onClick={addModule}
              className="inline-flex items-center space-x-1.5 bg-purple-100 dark:bg-brand-amethyst text-purple-800 dark:text-brand-lavender font-bold text-xs px-3.5 py-2 rounded-xl border border-purple-200 dark:border-brand-lavender/30 hover:bg-purple-200 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Module</span>
            </button>
          </div>

          <div className="space-y-4">
            {modules.map((mod, index) => (
              <div
                key={mod.id}
                className="p-4 bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-2xl space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-brand-lavender">
                    Module {index + 1}
                  </span>
                  {modules.length > 1 && (
                    <button
                      onClick={() => removeModule(mod.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Module Name
                    </label>
                    <input
                      type="text"
                      value={mod.name}
                      onChange={(e) => updateModule(mod.id, 'name', e.target.value)}
                      placeholder="e.g. User Authentication"
                      className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Assigned User Role
                    </label>
                    <input
                      type="text"
                      value={mod.userRole}
                      onChange={(e) => updateModule(mod.id, 'userRole', e.target.value)}
                      placeholder="e.g. Admin, Customer, Student"
                      className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Key Features (comma separated)
                    </label>
                    <input
                      type="text"
                      value={mod.features.join(', ')}
                      onChange={(e) =>
                        updateModule(
                          mod.id,
                          'features',
                          e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      placeholder="e.g. Login, Signup, OAuth, 2FA"
                      className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Module Description & Scope
                    </label>
                    <input
                      type="text"
                      value={mod.description}
                      onChange={(e) => updateModule(mod.id, 'description', e.target.value)}
                      placeholder="Detail the operational responsibility of this module..."
                      className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-border">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Step 1</span>
            </button>

            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center space-x-2 bg-purple-700 hover:bg-purple-800 dark:bg-brand-purple text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all"
            >
              <span>Continue to Step 3: Select Documents</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DOCUMENTATION SELECTION */}
      {step === 3 && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6 animate-scale-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-dark-border pb-4">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
                <span>Step 3 — Documentation Selection</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose which documents you want the AI engine to generate into your project workspace.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAllDocs}
                className="text-xs font-bold text-purple-700 dark:text-brand-lavender bg-purple-50 dark:bg-brand-amethyst/40 border border-purple-200 dark:border-brand-lavender/30 px-3 py-1.5 rounded-lg hover:bg-purple-100"
              >
                Select All
              </button>
              <button
                onClick={handleClearAllDocs}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-dark-border px-3 py-1.5 rounded-lg hover:bg-slate-100"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_DOC_TYPES.map((doc) => {
              const isSelected = selectedDocs.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocSelection(doc.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-brand-amethyst/50 border-purple-600 dark:border-brand-lavender ring-2 ring-purple-400/40 shadow-sm'
                      : 'bg-white dark:bg-dark-bg/40 border-slate-200 dark:border-dark-border hover:border-purple-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-xs text-slate-900 dark:text-white">
                        {doc.label}
                      </h4>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-brand-lavender shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
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
              className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Modules</span>
            </button>

            <button
              onClick={handleStartGeneration}
              disabled={selectedDocs.length === 0}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-purple-200 dark:text-brand-lavender animate-pulse" />
              <span>Generate Project Package ({selectedDocs.length} Documents)</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: LIVE GENERATION PROGRESS & SUCCESS */}
      {step === 4 && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-8 shadow-xl space-y-6 animate-scale-in max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-3xl bg-purple-100 dark:bg-brand-amethyst text-purple-700 dark:text-brand-lavender flex items-center justify-center mx-auto shadow-md border border-purple-200 dark:border-brand-lavender/30">
              {generating ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              )}
            </div>
            <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
              {generating ? 'Generating Project Documentation...' : 'Documentation Package Ready!'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {generating
                ? 'Synthesizing software engineering specifications, diagrams, and test matrices...'
                : `All ${selectedDocs.length} documents have been generated and assembled into your workspace.`}
            </p>
          </div>

          {/* Progress list checklist */}
          <div className="bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-2xl p-6 space-y-3">
            {generationSteps.map((s, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-xs font-semibold">
                {s.status === 'completed' ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : s.status === 'in-progress' ? (
                  <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 dark:bg-brand-amethyst dark:text-brand-lavender flex items-center justify-center shrink-0">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-dark-surface text-slate-400 flex items-center justify-center shrink-0">
                    <Circle className="w-3.5 h-3.5" />
                  </div>
                )}
                <span
                  className={
                    s.status === 'completed'
                      ? 'text-slate-900 dark:text-white'
                      : s.status === 'in-progress'
                      ? 'text-purple-700 dark:text-brand-lavender font-bold'
                      : 'text-slate-400'
                  }
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {!generating && createdProjectId && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-100 dark:border-dark-border">
              <Link
                href={`/project-docs/${createdProjectId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-xl hover:scale-[1.02] transition-all"
              >
                <span>Open Project Documentation Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => {
                  setStep(1);
                  setProjectName('');
                  setProjectDescription('');
                  setCreatedProjectId(null);
                }}
                className="w-full sm:w-auto text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-border px-6 py-3.5 rounded-xl hover:bg-slate-100"
              >
                Create Another Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. PREVIOUSLY CREATED PROJECTS LIST */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Your Project Workspaces
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access and manage all generated project packages
            </p>
          </div>
          <span className="text-xs font-bold bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender px-3 py-1 rounded-full border border-purple-200 dark:border-brand-lavender/30">
            {projectsList.length} Total Projects
          </span>
        </div>

        {loadingProjects ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-brand-purple" />
            <span>Loading workspaces...</span>
          </div>
        ) : projectsList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50 dark:bg-dark-bg/60 rounded-xl border border-dashed border-slate-200 dark:border-dark-border">
            <FolderGit2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No project packages created yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Complete the wizard above to synthesize your first complete software package.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsList.map((proj) => (
              <div
                key={proj.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg/50 hover:border-purple-500 transition-all shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-brand-lavender bg-purple-100 dark:bg-brand-amethyst/60 px-2.5 py-0.5 rounded border border-purple-200 dark:border-brand-lavender/30">
                      {proj.domain || 'Software'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(proj.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    {proj.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>

                  <div className="flex items-center space-x-2 text-xs font-semibold text-purple-700 dark:text-brand-lavender pt-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{proj.documents?.length || 0} Documents in Package</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
                  <Link
                    href={`/project-docs/${proj.id}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline"
                  >
                    <span>Open Workspace</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
