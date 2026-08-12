'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck2,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  FileText,
  Mail,
  Linkedin,
  Download,
  Copy,
  Plus,
  Trash2,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { ResumeData, ATSAnalysisResult } from '@/lib/types';
import { downloadDocumentFile, ExportFormat } from '@/lib/download';

export const dynamic = 'force-dynamic';


export default function CareerStudioPage() {
  // Tab Navigation ('builder' | 'analyzer' | 'documents' | 'preview')
  const [activeTab, setActiveTab] = useState<'builder' | 'analyzer' | 'documents' | 'preview'>('builder');

  // Resume Data State
  const [resume, setResume] = useState<ResumeData>({
    personalInfo: {
      fullName: 'Alex Morgan',
      email: 'alex.morgan@domain.com',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA',
      linkedIn: 'linkedin.com/in/alexmorgan',
      gitHub: 'github.com/alexmorgan',
      portfolio: 'alexmorgan.dev',
    },
    summary:
      'Results-driven Full Stack Software Engineer with 4+ years of experience building high-throughput web architectures, scalable RESTful APIs, and responsive React/Next.js interfaces. Proven track record of improving latency by 35% and mentoring engineering teams.',
    targetRole: 'Senior Full Stack Engineer',
    skills: {
      programmingLanguages: ['TypeScript', 'JavaScript (ES6+)', 'Python', 'SQL'],
      frameworks: ['Next.js 14', 'React 18', 'Node.js', 'Express', 'Tailwind CSS'],
      databases: ['PostgreSQL', 'Supabase', 'Redis', 'MongoDB'],
      tools: ['Docker', 'Git', 'GitHub Actions', 'AWS (S3, Lambda)', 'Vercel'],
      softSkills: ['System Design', 'Agile/Scrum', 'Technical Leadership', 'Code Review'],
    },
    education: [
      {
        degree: 'B.S. in Computer Science',
        institution: 'University of California, Berkeley',
        location: 'Berkeley, CA',
        year: '2020',
        gpaOrScore: '3.85 / 4.0',
      },
    ],
    experience: [
      {
        company: 'CloudScale Technologies',
        role: 'Full Stack Engineer',
        startDate: 'Jan 2022',
        endDate: 'Present',
        location: 'San Francisco, CA',
        responsibilities: [
          'Architected serverless document generation pipeline processing 50k+ daily exports with 99.9% uptime.',
          'Optimized PostgreSQL queries and connection pooling with Prisma, reducing p95 latency from 420ms to 180ms.',
          'Engineered responsive design system using Tailwind CSS and React 18, enhancing user retention by 28%.',
        ],
        achievements: ['Awarded Engineer of the Quarter 2023 for leading multi-model AI migration.'],
      },
    ],
    projects: [
      {
        name: 'EasyDoc AI — Document Generation Studio',
        description: 'Multi-model document synthesis engine supporting high-performance Gemini AI inference.',
        technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Prisma'],
        achievements: ['Achieved sub-second AI streaming throughput with 100% test automation pass rate.'],
        url: 'https://github.com/organization/easydoc',
      },
    ],
    certifications: ['AWS Certified Solutions Architect — Associate', 'Meta Certified Front-End Developer'],
    internships: ['Software Engineering Intern at Fintech Corp (Summer 2019)'],
    achievements: ['1st Place Winner at Silicon Valley Hackathon 2022'],
    publications: ['"Optimizing Serverless Data Pipelines" — IEEE Technical Review 2021'],
    languages: ['English (Native)', 'Spanish (Professional)'],
  });

  // JD Analyzer State
  const [jobDescription, setJobDescription] = useState(
    `Looking for a Senior Full Stack Engineer with strong experience in React, TypeScript, Next.js, Node.js, and PostgreSQL. Experience with Docker, AWS cloud infrastructure, CI/CD pipelines, and microservices architecture is highly preferred.`
  );
  const [analyzingJD, setAnalyzingJD] = useState(false);
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysisResult | null>(null);

  // Career Documents Generator State
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [generatedDocResult, setGeneratedDocResult] = useState<{ title: string; content: string; documentId?: string } | null>(null);
  const [targetCompany, setTargetCompany] = useState('Acme Technologies');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);

  // Run ATS Job Description Analysis
  const handleAnalyzeJD = async () => {
    if (!jobDescription.trim()) {
      alert('Please paste a job description to analyze.');
      return;
    }

    setAnalyzingJD(true);
    setToastMessage(null);

    try {
      const res = await fetch('/api/career/ats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription }),
      });

      if (res.ok) {
        const data = await res.json();
        setAtsAnalysis(data.analysis);
        setToastMessage(`ATS Match Score: ${data.analysis.atsScore}%!`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingJD(false);
    }
  };

  // Generate Career Document (Cover Letter / LinkedIn / Application Email)
  const handleGenerateCareerDoc = async (docType: 'cover-letter' | 'linkedin-about' | 'application-email' | 'portfolio-bio') => {
    setGeneratingDoc(true);
    setToastMessage(null);

    try {
      const res = await fetch('/api/career/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          resume,
          targetRole: resume.targetRole,
          companyName: targetCompany,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedDocResult(data);
        setToastMessage(`Generated ${data.title}!`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingDoc(false);
    }
  };

  const router = useRouter();
  const [openingInEditor, setOpeningInEditor] = useState(false);
  const [resumeMarkdown, setResumeMarkdown] = useState('');

  const buildResumeMarkdown = (data: ResumeData) => {
    return `# ${data.personalInfo.fullName}
${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}
LinkedIn: ${data.personalInfo.linkedIn} | GitHub: ${data.personalInfo.gitHub}

[TEMPLATE_BADGE] ATS Professional Resume • ${data.targetRole || 'Software Engineer'}

## PROFESSIONAL SUMMARY
${data.summary}

## CORE TECHNICAL SKILLS
- Programming: ${data.skills.programmingLanguages.join(', ')}
- Frameworks: ${data.skills.frameworks.join(', ')}
- Databases: ${data.skills.databases.join(', ')}
- Tools: ${data.skills.tools.join(', ')}
- Soft Skills: ${data.skills.softSkills.join(', ')}

## PROFESSIONAL EXPERIENCE
${data.experience
  .map(
    (e) => `### ${e.role} — ${e.company} (${e.startDate} - ${e.endDate})
${e.responsibilities.map((r) => `- ${r}`).join('\n')}`
  )
  .join('\n\n')}

## TECHNICAL PROJECTS
${data.projects
  .map(
    (p) => `### ${p.name}
Technologies: ${p.technologies.join(', ')}
${p.description}
${p.achievements.map((a) => `- ${a}`).join('\n')}`
  )
  .join('\n\n')}

## EDUCATION
${data.education.map((ed) => `- ${ed.degree}, ${ed.institution} (${ed.year}) — GPA: ${ed.gpaOrScore}`).join('\n')}

## CERTIFICATIONS
${data.certifications.map((c) => `- ${c}`).join('\n')}
`;
  };

  useEffect(() => {
    setResumeMarkdown(buildResumeMarkdown(resume));
  }, [resume]);

  // Open Resume in Full Document Editor
  const handleOpenResumeInDocumentEditor = async () => {
    setOpeningInEditor(true);
    try {
      const contentToSave = resumeMarkdown || buildResumeMarkdown(resume);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${resume.personalInfo.fullName} - ATS Resume`,
          content: contentToSave.trim(),
        }),
      });

      if (res.ok) {
        const doc = await res.json();
        router.push(`/editor/${doc.id}`);
      } else {
        alert('Failed to save resume into document editor.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error opening in editor: ' + (e?.message || 'Unknown error'));
    } finally {
      setOpeningInEditor(false);
    }
  };

  // Open Any Career Document in Document Editor
  const handleOpenCareerDocInEditor = async (docTitle: string, docContent: string) => {
    setOpeningInEditor(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          content: docContent.trim(),
        }),
      });

      if (res.ok) {
        const doc = await res.json();
        router.push(`/editor/${doc.id}`);
      } else {
        alert('Failed to save document.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error opening in editor: ' + (e?.message || 'Unknown error'));
    } finally {
      setOpeningInEditor(false);
    }
  };

  // Export Resume as Markdown Text
  const handleExportResumeText = () => {
    const rawResume = resumeMarkdown || buildResumeMarkdown(resume);
    const blob = new Blob([rawResume], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.personalInfo.fullName.replace(/\s+/g, '_')}_ATS_Resume.md`;
    a.click();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-400/40 text-xs font-bold animate-slide-up flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender px-3 py-1 rounded-full text-xs font-bold mb-2 border border-purple-200 dark:border-brand-lavender/30">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Feature 7 • Career Studio & ATS Resume Suite</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Career Studio
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Build ATS-compliant resumes, run real-time job description keyword match analysis, and generate tailored career materials.
          </p>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex flex-wrap items-center bg-white dark:bg-dark-surface p-1 rounded-2xl border border-slate-200 dark:border-dark-border text-xs font-bold shadow-sm gap-1">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'builder'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ATS Resume Builder
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'preview'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Live Resume & Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'analyzer'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            JD Match Analyzer
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'documents'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cover Letters & Bios
          </button>
        </div>
      </div>

      {/* 1. TAB: ATS RESUME BUILDER */}
      {activeTab === 'builder' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
                <span>Candidate Profile & ATS Form</span>
              </h2>
              <p className="text-xs text-slate-500">
                Single-column, keyword-dense resume structured for 100% ATS parser readability
              </p>
            </div>

            <button
              onClick={handleExportResumeText}
              className="inline-flex items-center space-x-1.5 bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender font-bold text-xs px-4 py-2 rounded-xl border border-purple-200 dark:border-brand-lavender/30 hover:bg-purple-200 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export ATS Text</span>
            </button>
          </div>

          {/* Personal Info Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider">
              1. Personal Information & Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={resume.personalInfo.fullName}
                  onChange={(e) =>
                    setResume({ ...resume, personalInfo: { ...resume.personalInfo, fullName: e.target.value } })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={resume.personalInfo.email}
                  onChange={(e) =>
                    setResume({ ...resume, personalInfo: { ...resume.personalInfo, email: e.target.value } })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Phone</label>
                <input
                  type="text"
                  value={resume.personalInfo.phone}
                  onChange={(e) =>
                    setResume({ ...resume, personalInfo: { ...resume.personalInfo, phone: e.target.value } })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Location</label>
                <input
                  type="text"
                  value={resume.personalInfo.location}
                  onChange={(e) =>
                    setResume({ ...resume, personalInfo: { ...resume.personalInfo, location: e.target.value } })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-dark-border">
            <h3 className="text-xs font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider">
              2. Executive Summary
            </h3>
            <textarea
              rows={3}
              value={resume.summary}
              onChange={(e) => setResume({ ...resume, summary: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          {/* Skills Matrix */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-dark-border">
            <h3 className="text-xs font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider">
              3. Core Competencies & Skills Matrix
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Programming Languages (comma separated)
                </label>
                <input
                  type="text"
                  value={resume.skills.programmingLanguages.join(', ')}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      skills: {
                        ...resume.skills,
                        programmingLanguages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Frameworks & Libraries
                </label>
                <input
                  type="text"
                  value={resume.skills.frameworks.join(', ')}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      skills: {
                        ...resume.skills,
                        frameworks: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Databases</label>
                <input
                  type="text"
                  value={resume.skills.databases.join(', ')}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      skills: {
                        ...resume.skills,
                        databases: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Tools, Cloud & DevOps
                </label>
                <input
                  type="text"
                  value={resume.skills.tools.join(', ')}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      skills: {
                        ...resume.skills,
                        tools: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: JD MATCH ANALYZER */}
      {activeTab === 'analyzer' && (
        <div className="space-y-6 animate-scale-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <Search className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
                <span>Job Description Keyword Match & ATS Analyzer</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Paste any job vacancy description to benchmark your resume and discover critical missing keywords.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Target Job Description
              </label>
              <textarea
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the employer's job description, requirements, and responsibilities here..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAnalyzeJD}
                disabled={analyzingJD}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {analyzingJD ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing Keywords & Scoring ATS Match...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Run ATS Match Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results View */}
          {atsAnalysis && (
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-scale-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-dark-border pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender">
                    Benchmark Result
                  </span>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                    ATS Match Score: {atsAnalysis.atsScore}%
                  </h3>
                </div>

                <div className="flex items-center space-x-2 text-xs font-bold">
                  <span className="p-2 bg-purple-50 dark:bg-brand-amethyst/40 rounded-xl text-purple-800 dark:text-brand-lavender">
                    Keywords: {atsAnalysis.keywordScore}%
                  </span>
                  <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-700 dark:text-emerald-400">
                    Formatting: {atsAnalysis.formattingScore}%
                  </span>
                </div>
              </div>

              {/* Matched vs Missing Keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Matched Keywords in Resume ({atsAnalysis.matchedKeywords?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {atsAnalysis.matchedKeywords?.map((kw: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs bg-white dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Missing Keywords from JD ({atsAnalysis.missingKeywords?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {atsAnalysis.missingKeywords?.map((kw: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs bg-white dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-semibold px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-700"
                      >
                        ⚠ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-5 bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider block">
                  Ethical Alignment Recommendations:
                </span>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {atsAnalysis.suggestions?.map((s: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: CAREER DOCUMENTS GENERATOR */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-scale-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
                <span>1-Click Career Document Generator</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Convert your resume profile into tailored Cover Letters, LinkedIn summaries, and application emails.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Target Role</label>
                <input
                  type="text"
                  value={resume.targetRole}
                  onChange={(e) => setResume({ ...resume, targetRole: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Company Name</label>
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="e.g. Acme Corp / Google / Stripe"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <button
                onClick={() => handleGenerateCareerDoc('cover-letter')}
                disabled={generatingDoc}
                className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-purple-50 dark:bg-brand-amethyst/40 hover:border-purple-500 text-left transition-all space-y-1 group"
              >
                <FileText className="w-5 h-5 text-purple-700 dark:text-brand-lavender" />
                <h4 className="font-display font-bold text-xs text-slate-900 dark:text-white">
                  Cover Letter
                </h4>
                <p className="text-[10px] text-slate-500">Formal letter to hiring team</p>
              </button>

              <button
                onClick={() => handleGenerateCareerDoc('linkedin-about')}
                disabled={generatingDoc}
                className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60 hover:border-purple-500 text-left transition-all space-y-1 group"
              >
                <Linkedin className="w-5 h-5 text-blue-600" />
                <h4 className="font-display font-bold text-xs text-slate-900 dark:text-white">
                  LinkedIn About
                </h4>
                <p className="text-[10px] text-slate-500">Engaging profile narrative</p>
              </button>

              <button
                onClick={() => handleGenerateCareerDoc('application-email')}
                disabled={generatingDoc}
                className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60 hover:border-purple-500 text-left transition-all space-y-1 group"
              >
                <Mail className="w-5 h-5 text-purple-600" />
                <h4 className="font-display font-bold text-xs text-slate-900 dark:text-white">
                  Application Email
                </h4>
                <p className="text-[10px] text-slate-500">Direct pitch to recruiter</p>
              </button>

              <button
                onClick={() => handleGenerateCareerDoc('portfolio-bio')}
                disabled={generatingDoc}
                className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60 hover:border-purple-500 text-left transition-all space-y-1 group"
              >
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <h4 className="font-display font-bold text-xs text-slate-900 dark:text-white">
                  Portfolio Bio
                </h4>
                <p className="text-[10px] text-slate-500">Short & long biography</p>
              </button>
            </div>
          </div>

          {/* Generated Result Display */}
          {generatedDocResult && (
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 animate-scale-in">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3 gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-brand-lavender">
                    Generated Document
                  </span>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    {generatedDocResult.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedDocResult.content);
                      setToastMessage('Copied to clipboard!');
                      setTimeout(() => setToastMessage(null), 2500);
                    }}
                    className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all border border-slate-200 dark:border-dark-border"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>

                  <button
                    onClick={() => handleOpenCareerDocInEditor(generatedDocResult.title, generatedDocResult.content)}
                    disabled={openingInEditor}
                    className="inline-flex items-center space-x-1.5 bg-purple-700 hover:bg-purple-800 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    {openingInEditor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
                    <span>Open in Word Editor</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Document Content (Editable Markdown):
                </label>
                <textarea
                  rows={12}
                  value={generatedDocResult.content}
                  onChange={(e) =>
                    setGeneratedDocResult({
                      ...generatedDocResult,
                      content: e.target.value,
                    })
                  }
                  className="w-full p-4 bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-2xl font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed custom-scrollbar"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB: LIVE RESUME & MARKDOWN EDITOR */}
      {activeTab === 'preview' && (
        <div className="space-y-6 animate-scale-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-dark-border pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-brand-lavender tracking-wider">
                  Live Synchronization
                </span>
                <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center space-x-2">
                  <Edit3 className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
                  <span>Interactive Resume Editor & Formatted Preview</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Edit resume markdown text directly on the left with live real-time ATS layout updates on the right.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportResumeText}
                  className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-dark-border transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-purple-500" />
                  <span>Download .MD</span>
                </button>

                <button
                  onClick={handleOpenResumeInDocumentEditor}
                  disabled={openingInEditor}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {openingInEditor ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Edit3 className="w-4 h-4 text-purple-200" />
                  )}
                  <span>Open & Edit in Full Word Editor</span>
                </button>
              </div>
            </div>

            {/* Split Editor / Preview Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Interactive Markdown Textarea */}
              <div className="lg:col-span-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Raw Markdown Editor</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Edits sync in real-time</span>
                </div>

                <textarea
                  rows={26}
                  value={resumeMarkdown}
                  onChange={(e) => setResumeMarkdown(e.target.value)}
                  className="w-full p-5 bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl font-mono text-xs leading-relaxed focus:outline-none focus:border-purple-500 custom-scrollbar shadow-inner"
                  placeholder="Type your markdown resume here..."
                />
              </div>

              {/* Right: Live ATS Rendered Card */}
              <div className="lg:col-span-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>ATS Formatted Preview</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Standard 1-Column ATS</span>
                </div>

                <div className="p-6 sm:p-8 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm text-xs font-sans text-slate-900 dark:text-slate-100 space-y-4 max-h-[580px] overflow-y-auto custom-scrollbar">
                  {/* Header */}
                  <div className="border-b border-slate-300 dark:border-slate-700 pb-3 text-center space-y-1">
                    <h2 className="font-display font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">
                      {resume.personalInfo.fullName}
                    </h2>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {resume.personalInfo.email} • {resume.personalInfo.phone} • {resume.personalInfo.location}
                    </p>
                    <p className="text-[11px] text-purple-700 dark:text-brand-lavender font-medium">
                      {resume.personalInfo.linkedIn} • {resume.personalInfo.gitHub}
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-purple-800 dark:text-purple-300 border-b border-slate-200 dark:border-slate-800 pb-0.5">
                      Professional Summary
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {resume.summary}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-purple-800 dark:text-purple-300 border-b border-slate-200 dark:border-slate-800 pb-0.5">
                      Technical Skills
                    </h3>
                    <ul className="space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
                      <li>• <strong>Languages:</strong> {resume.skills.programmingLanguages.join(', ')}</li>
                      <li>• <strong>Frameworks:</strong> {resume.skills.frameworks.join(', ')}</li>
                      <li>• <strong>Databases:</strong> {resume.skills.databases.join(', ')}</li>
                      <li>• <strong>Tools & Cloud:</strong> {resume.skills.tools.join(', ')}</li>
                    </ul>
                  </div>

                  {/* Experience */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-purple-800 dark:text-purple-300 border-b border-slate-200 dark:border-slate-800 pb-0.5">
                      Experience
                    </h3>
                    {resume.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between font-bold text-xs text-slate-900 dark:text-white">
                          <span>{exp.role} — {exp.company}</span>
                          <span className="text-slate-500 font-normal">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <ul className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                          {exp.responsibilities.map((r, rIdx) => (
                            <li key={rIdx} className="flex items-start space-x-1.5">
                              <span>•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Education */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-purple-800 dark:text-purple-300 border-b border-slate-200 dark:border-slate-800 pb-0.5">
                      Education
                    </h3>
                    {resume.education.map((ed, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span><strong>{ed.degree}</strong>, {ed.institution}</span>
                        <span>{ed.year} ({ed.gpaOrScore})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
