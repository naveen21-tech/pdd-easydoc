'use client';

import { useState } from 'react';
import {
  FileCheck2,
  Sparkles,
  Download,
  Copy,
  Check,
  Loader2,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  FileType,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { downloadDocumentFile, ExportFormat } from '@/lib/download';

export const dynamic = 'force-dynamic';

export default function ResumeBuilderPage() {
  const [formatStyle, setFormatStyle] = useState('Professional');
  const [role, setRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Experienced');
  const [fullName, setFullName] = useState('');
  const [targetTitle, setTargetTitle] = useState('');
  const [keySkills, setKeySkills] = useState('');
  const [experienceDetails, setExperienceDetails] = useState('');
  const [educationDetails, setEducationDetails] = useState('');
  const [projectsCertifications, setProjectsCertifications] = useState('');

  const [generating, setGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState('');
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formatStyles = ['Professional', 'Modern', 'Minimal', 'Classic', 'Executive'];
  const rolesList = [
    'Software Engineer',
    'Data Scientist',
    'UI/UX Designer',
    'Business Analyst',
    'Marketing Manager',
    'Finance Specialist',
    'HR Manager',
    'Healthcare Professional',
    'Teacher / Educator',
    'Student / Intern',
  ];
  const expLevels = ['Fresher', 'Intern', 'Junior (1-3 yrs)', 'Experienced (4-8 yrs)', 'Senior / Lead'];

  const handleGenerateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !targetTitle) {
      setError('Please provide your Full Name and Target Job Title.');
      return;
    }

    setGenerating(true);
    setError(null);
    setToastMessage(null);
    setGeneratedResume('');
    setCreatedDocId(null);

    const instructions = `Generate a high-pass-rate ATS-Friendly Resume for ${fullName}.
Target Role: ${targetTitle} (${role})
Experience Level: ${experienceLevel}
Format Style: ${formatStyle}

Key Skills:
${keySkills || 'Standard industry skills for ' + role}

Work Experience:
${experienceDetails || 'Detail key impact metrics, responsibilities, and technical achievements.'}

Education:
${educationDetails || 'University degree, major, graduation year, GPA/Honors.'}

Projects & Certifications:
${projectsCertifications || 'Key portfolio projects and professional certifications.'}

REQUIREMENTS:
- Format with clean ATS-parsable sections: # EXECUTIVE SUMMARY, ## CORE COMPETENCIES, ## PROFESSIONAL EXPERIENCE (using STAR method with quantified metrics), ## PROJECTS, ## EDUCATION, ## CERTIFICATIONS.
- Avoid multi-column tables or complex graphical elements so ATS scanners parse 100% of keywords.`;

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${fullName} - ${targetTitle} (ATS Resume)`,
          tone: 'Professional & Impactful',
          instructions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate ATS resume.');
      }

      setGeneratedResume(data.document.content);
      setCreatedDocId(data.document.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResume) return;
    navigator.clipboard.writeText(generatedResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerDownload = (fmt: ExportFormat) => {
    if (!createdDocId) return;
    setError(null);
    setToastMessage(null);

    downloadDocumentFile({
      documentId: createdDocId,
      title: `${fullName}_Resume`,
      format: fmt,
      onStart: () => setDownloadingFormat(fmt),
      onSuccess: (filename) => {
        setToastMessage(`Downloaded "${filename}" successfully!`);
      },
      onError: (msg) => {
        setError(msg);
      },
      onFinish: () => setDownloadingFormat(null),
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-50 dark:bg-brand-amethyst/60 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-brand-lavender/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <FileCheck2 className="w-3.5 h-3.5 text-purple-600 dark:text-brand-lavender" />
            <span>99.4% ATS Scanner Pass Guarantee</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">ATS Resume Builder</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create interview-winning, ATS-friendly resumes optimized for corporate recruitment algorithms
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 flex items-center space-x-3 text-green-700 dark:text-green-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center space-x-3 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 shadow-card space-y-6">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-border flex items-center space-x-2">
            <User className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
            <span>Resume & Profile Configurations</span>
          </h3>

          <form onSubmit={handleGenerateResume} className="space-y-5">
            {/* Template Style Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                ATS Layout Format
              </label>
              <div className="flex flex-wrap gap-2">
                {formatStyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setFormatStyle(style)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      formatStyle === style
                        ? 'bg-purple-600 dark:bg-brand-purple text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Role & Exp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  Primary Domain / Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender text-slate-900 dark:text-white"
                >
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  Experience Tier
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender text-slate-900 dark:text-white"
                >
                  {expLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  Target Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  placeholder="e.g. Senior React Developer"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {/* Core Skills */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                Core Skills & Keywords
              </label>
              <textarea
                rows={2}
                value={keySkills}
                onChange={(e) => setKeySkills(e.target.value)}
                placeholder="TypeScript, React, Next.js, Node.js, PostgreSQL, AWS, CI/CD..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Work History */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                Work Experience Details
              </label>
              <textarea
                rows={3}
                value={experienceDetails}
                onChange={(e) => setExperienceDetails(e.target.value)}
                placeholder="Company, Role, Dates, Key projects led, impact metrics (e.g. Increased page speed by 40%)..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Education & Certs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  Education
                </label>
                <input
                  type="text"
                  value={educationDetails}
                  onChange={(e) => setEducationDetails(e.target.value)}
                  placeholder="B.Tech Computer Science, Stanford University (2020-2024)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  Certifications & Projects
                </label>
                <input
                  type="text"
                  value={projectsCertifications}
                  onChange={(e) => setProjectsCertifications(e.target.value)}
                  placeholder="AWS Solutions Architect, Full-Stack E-Commerce SaaS"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 dark:bg-brand-purple hover:bg-purple-700 dark:hover:bg-purple-600 text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Synthesizing ATS Resume...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate ATS Resume</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preview & Export Column (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 shadow-card flex flex-col min-h-[550px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border mb-4">
            <div className="flex items-center space-x-2">
              <FileCheck2 className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">ATS Resume Live Preview</h3>
            </div>

            {generatedResume && (
              <button
                onClick={handleCopy}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-brand-lavender hover:bg-slate-100 dark:hover:bg-dark-hover rounded-lg transition-colors text-xs flex items-center space-x-1 border border-slate-200 dark:border-dark-border"
              >
                {copied ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-200 dark:border-dark-border p-6 font-mono text-xs leading-relaxed overflow-y-auto max-h-[500px]">
            {generating ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                <Loader2 className="w-8 h-8 text-purple-600 dark:text-brand-lavender animate-spin mx-auto" />
                <p className="font-bold text-slate-900 dark:text-white text-sm">Building ATS Keyword-Optimized Resume...</p>
              </div>
            ) : generatedResume ? (
              <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 font-mono text-xs">{generatedResume}</div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400 dark:text-slate-500 space-y-3">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">No Resume Generated Yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                  Fill in your details on the left and click Generate ATS Resume.
                </p>
              </div>
            )}
          </div>

          {/* Export Bar */}
          {createdDocId && (
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Export ATS Resume Format:
              </span>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => triggerDownload('pdf')}
                  disabled={downloadingFormat !== null}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1 bg-purple-600 dark:bg-brand-purple hover:bg-purple-700 dark:hover:bg-purple-600 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {downloadingFormat === 'pdf' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>PDF</span>
                </button>

                <button
                  onClick={() => triggerDownload('docx')}
                  disabled={downloadingFormat !== null}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1 bg-slate-800 dark:bg-purple-950 dark:hover:bg-purple-900 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm border dark:border-purple-800/50 disabled:opacity-50"
                >
                  {downloadingFormat === 'docx' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>DOCX</span>
                </button>

                <button
                  onClick={() => triggerDownload('txt')}
                  disabled={downloadingFormat !== null}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-700 dark:text-slate-200 font-semibold text-xs px-3.5 py-2 rounded-xl disabled:opacity-50"
                >
                  {downloadingFormat === 'txt' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileType className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  )}
                  <span>TXT</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
