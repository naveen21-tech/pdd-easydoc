'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  FileText,
  FileSpreadsheet,
  FileCheck2,
  Target,
  Award,
  Activity,
  MessageSquareText,
  Users,
  CheckSquare,
  CalendarCheck,
  Download,
  Edit3,
  Copy,
  Plus,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Zap,
  ArrowRight,
  Layers,
  Clock,
  Printer,
} from 'lucide-react';
import { FacultyDocType, FacultyDocRequest, DocumentItem } from '@/lib/types';
import { downloadDocumentFile, ExportFormat } from '@/lib/download';

export const dynamic = 'force-dynamic';

interface DocTypeConfig {
  id: FacultyDocType;
  title: string;
  desc: string;
  badge: string;
  icon: any;
  defaultMarks?: number;
  defaultDuration?: number;
  bloomsFocus: string;
}

const FACULTY_DOC_TYPES: DocTypeConfig[] = [
  {
    id: 'Lesson Plan',
    title: 'Lesson Plan',
    desc: 'Weekly lecture breakdown, learning objectives, instructional pedagogy, and assessment mapping.',
    badge: 'Curriculum Planning',
    icon: BookOpen,
    bloomsFocus: 'L1 (Remember) to L4 (Analyze)',
  },
  {
    id: 'Question Paper',
    title: 'Question Paper',
    desc: 'Examinations with Bloom’s taxonomy levels, Course Outcomes (CO) mapping, and Part A/B/C structure.',
    badge: 'Assessment & Exam',
    icon: FileSpreadsheet,
    defaultMarks: 100,
    defaultDuration: 180,
    bloomsFocus: 'L1 to L5 (Remember to Evaluate)',
  },
  {
    id: 'Assignment Sheet',
    title: 'Assignment Sheet',
    desc: 'Analytical problem sets, case studies, submission guidelines, and multi-criteria grading rubrics.',
    badge: 'Student Assignment',
    icon: FileCheck2,
    defaultMarks: 30,
    bloomsFocus: 'L3 (Apply) to L5 (Evaluate)',
  },
  {
    id: 'Course Outcomes',
    title: 'Course Outcomes (CO-PO)',
    desc: 'Bloom’s revised taxonomy statements, CO-PO/PSO correlation matrices, and attainment formulas.',
    badge: 'NBA / NAAC Compliance',
    icon: Target,
    bloomsFocus: 'Outcome-Based Education (OBE)',
  },
  {
    id: 'Internal Assessment Report',
    title: 'Internal Assessment Report',
    desc: 'Continuous evaluation summary, class marks distribution, slow/fast learner identification & action plan.',
    badge: 'Academic Evaluation',
    icon: Activity,
    defaultMarks: 50,
    bloomsFocus: 'Diagnostic Performance',
  },
  {
    id: 'Student Feedback Form',
    title: 'Student Feedback Form',
    desc: 'Likert-scale course survey covering curriculum delivery, pedagogy, laboratory support & fairness.',
    badge: 'Quality Assurance',
    icon: MessageSquareText,
    bloomsFocus: 'Course Exit Survey',
  },
  {
    id: 'Attendance Report',
    title: 'Attendance Report',
    desc: 'Instructional hours register, attendance shortage list (<75%), alert actions & condonation status.',
    badge: 'Student Tracking',
    icon: Users,
    bloomsFocus: 'Eligibility Verification',
  },
  {
    id: 'Meeting Minutes',
    title: 'Meeting Minutes (MoM)',
    desc: 'Department Academic Committee & Board of Studies minutes with action items, assignees & deadlines.',
    badge: 'Department Records',
    icon: CalendarCheck,
    bloomsFocus: 'Governance & Action Plan',
  },
  {
    id: 'Academic Report',
    title: 'Academic Report',
    desc: 'End-of-semester course completion report, syllabus execution proof & accreditation summaries.',
    badge: 'Semester Summary',
    icon: GraduationCap,
    bloomsFocus: 'Continuous Improvement',
  },
];

const COURSE_PRESETS = [
  {
    courseName: 'Data Structures & Algorithms',
    courseCode: 'CS-201',
    department: 'Computer Science & Engineering',
    semester: 'Semester III',
    targetUnitOrTopic: 'Unit 3: Balanced Trees, B-Trees & Graph Traversal Algorithms',
  },
  {
    courseName: 'Artificial Intelligence & Machine Learning',
    courseCode: 'AI-401',
    department: 'Artificial Intelligence & Data Science',
    semester: 'Semester VII',
    targetUnitOrTopic: 'Unit 4: Deep Neural Networks, Backpropagation & Transformers',
  },
  {
    courseName: 'Distributed Cloud Systems & Microservices',
    courseCode: 'CS-502',
    department: 'Computer Science & Engineering',
    semester: 'Semester V',
    targetUnitOrTopic: 'Unit 2: Event-Driven Topology, Kafka Messaging & Consensus Protocols',
  },
  {
    courseName: 'Cybersecurity & Cryptography',
    courseCode: 'IT-305',
    department: 'Information Technology',
    semester: 'Semester VI',
    targetUnitOrTopic: 'Unit 3: Public Key Cryptography, RSA, ECC & Zero-Trust Security',
  },
  {
    courseName: 'Database Management Systems',
    courseCode: 'CS-304',
    department: 'Computer Science & Engineering',
    semester: 'Semester IV',
    targetUnitOrTopic: 'Unit 4: Transaction Processing, ACID Guarantees & Concurrency Control',
  },
];

export default function FacultyStudioPage() {
  // Document Configuration State
  const [selectedDocType, setSelectedDocType] = useState<FacultyDocType>('Lesson Plan');
  const [courseName, setCourseName] = useState('Data Structures & Algorithms');
  const [courseCode, setCourseCode] = useState('CS-201');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState('Semester III');
  const [academicYear, setAcademicYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  const [instructorName, setInstructorName] = useState('Dr. Sarah Jenkins, Associate Professor');
  const [targetUnitOrTopic, setTargetUnitOrTopic] = useState('Unit 3: Balanced Trees, B-Trees & Graph Algorithms');
  const [bloomsTaxonomyLevel, setBloomsTaxonomyLevel] = useState('L1 (Remember) to L5 (Evaluate)');
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [specificInstructions, setSpecificInstructions] = useState('Strictly adhere to NBA Outcome-Based Education (OBE) and Bloom’s Revised Taxonomy guidelines.');
  const [additionalDetails, setAdditionalDetails] = useState('');

  // Generation & Canvas State
  const [generating, setGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<{ id: string; title: string; content: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pastFacultyDocs, setPastFacultyDocs] = useState<DocumentItem[]>([]);
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);

  useEffect(() => {
    fetchFacultyDocs();
  }, []);

  const fetchFacultyDocs = async () => {
    try {
      const res = await fetch('/api/faculty');
      if (res.ok) {
        const data = await res.json();
        setPastFacultyDocs(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyPreset = (preset: typeof COURSE_PRESETS[0]) => {
    setCourseName(preset.courseName);
    setCourseCode(preset.courseCode);
    setDepartment(preset.department);
    setSemester(preset.semester);
    setTargetUnitOrTopic(preset.targetUnitOrTopic);
    setToastMessage(`Selected course: ${preset.courseName}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSelectDocType = (type: FacultyDocType) => {
    setSelectedDocType(type);
    const config = FACULTY_DOC_TYPES.find((d) => d.id === type);
    if (config?.defaultMarks) setTotalMarks(config.defaultMarks);
    if (config?.defaultDuration) setDurationMinutes(config.defaultDuration);
    if (config?.bloomsFocus) setBloomsTaxonomyLevel(config.bloomsFocus);
  };

  const handleGenerate = async () => {
    if (!courseName.trim()) {
      alert('Please enter a course name.');
      return;
    }

    setGenerating(true);
    setToastMessage(null);

    try {
      const payload: FacultyDocRequest = {
        docType: selectedDocType,
        courseName,
        courseCode,
        department,
        semester,
        academicYear,
        instructorName,
        targetUnitOrTopic,
        bloomsTaxonomyLevel,
        totalMarks: Number(totalMarks) || 100,
        durationMinutes: Number(durationMinutes) || 180,
        specificInstructions,
        additionalDetails,
      };

      const res = await fetch('/api/faculty/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.content) {
        setGeneratedDoc({
          id: data.documentId,
          title: data.title,
          content: data.content,
        });
        setToastMessage(`✓ Generated ${selectedDocType} successfully!`);
        setTimeout(() => setToastMessage(null), 3500);
        fetchFacultyDocs();
      } else {
        throw new Error(data.error || 'Failed to generate faculty document');
      }
    } catch (e: any) {
      console.error(e);
      alert('Generation error: ' + (e?.message || 'Please check connection.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = (format: ExportFormat) => {
    if (!generatedDoc) return;
    downloadDocumentFile({
      documentId: generatedDoc.id,
      title: generatedDoc.title,
      format,
      onStart: () => setDownloadingFormat(format),
      onFinish: () => setDownloadingFormat(null),
    });
  };

  const handleCopyMarkdown = () => {
    if (!generatedDoc) return;
    navigator.clipboard.writeText(generatedDoc.content);
    setToastMessage('Copied document markdown to clipboard!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLoadPastDoc = (doc: DocumentItem) => {
    setGeneratedDoc({
      id: doc.id,
      title: doc.title,
      content: doc.content,
    });
    setToastMessage(`Loaded "${doc.title}"!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const activeTypeConfig = FACULTY_DOC_TYPES.find((d) => d.id === selectedDocType) || FACULTY_DOC_TYPES[0];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-400/40 text-xs font-bold animate-slide-up flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender px-3 py-1 rounded-full text-xs font-bold mb-2 border border-purple-200 dark:border-brand-lavender/30">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Feature • Faculty Document Assistant & OBE Studio</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Faculty Document Assistant
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Generate submission-ready Lesson Plans, Question Papers, Assignment Sheets, CO-PO Mapping Matrices, Assessment Reports, and Meeting Minutes.
          </p>
        </div>

        {generatedDoc && (
          <div className="flex items-center space-x-2">
            <Link
              href={`/editor/${generatedDoc.id}`}
              className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-purple-200" />
              <span>Edit in Word Editor</span>
            </Link>
          </div>
        )}
      </div>

      {/* 1. Academic Document Type Selector Grid */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
          <Layers className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
          <span>Choose Academic Deliverable Type</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FACULTY_DOC_TYPES.map((d) => {
            const isSelected = selectedDocType === d.id;
            const Icon = d.icon;
            return (
              <div
                key={d.id}
                onClick={() => handleSelectDocType(d.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3 select-none ${
                  isSelected
                    ? 'border-purple-600 dark:border-brand-lavender bg-purple-50 dark:bg-brand-amethyst/60 ring-2 ring-purple-400/40 shadow-sm'
                    : 'border-slate-200 dark:border-dark-border hover:border-purple-300 bg-white dark:bg-dark-surface'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-100 dark:bg-brand-amethyst/40 text-purple-700 dark:text-brand-lavender'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-xs text-slate-900 dark:text-white">
                      {d.title}
                    </h4>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender bg-purple-100/80 dark:bg-brand-amethyst px-1.5 py-0.5 rounded-md">
                      {d.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {d.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Course & Configuration Form */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6">
        {/* Quick Course Presets */}
        <div className="space-y-1.5 pb-2 border-b border-slate-100 dark:border-dark-border">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender flex items-center space-x-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>1-Click Sample Course Presets:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {COURSE_PRESETS.map((pr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(pr)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-purple-200 dark:border-brand-lavender/30 bg-purple-50 dark:bg-brand-amethyst/30 hover:bg-purple-100 text-purple-900 dark:text-brand-lavender transition-all"
              >
                {pr.courseName} ({pr.courseCode})
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Course Title / Subject *
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Data Structures & Algorithms"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Course Code
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. CS-201"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Semester / Term
            </label>
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="e.g. Semester III"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Academic Year
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2026-2027"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Faculty In-Charge
            </label>
            <input
              type="text"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              placeholder="e.g. Dr. Sarah Jenkins"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Target Unit / Topic Scope / Assessment Syllabus
          </label>
          <input
            type="text"
            value={targetUnitOrTopic}
            onChange={(e) => setTargetUnitOrTopic(e.target.value)}
            placeholder="e.g. Unit 3: Balanced Trees, B-Trees & Graph Algorithms"
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white"
          />
        </div>

        {/* Question Paper & Assessment Parameters */}
        {(selectedDocType === 'Question Paper' || selectedDocType === 'Assignment Sheet' || selectedDocType === 'Internal Assessment Report') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-dark-border">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Total Marks
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Exam Duration (Minutes)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Bloom's Taxonomy Target
              </label>
              <input
                type="text"
                value={bloomsTaxonomyLevel}
                onChange={(e) => setBloomsTaxonomyLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Special Institutional Constraints / Instructions
          </label>
          <textarea
            rows={2}
            value={specificInstructions}
            onChange={(e) => setSpecificInstructions(e.target.value)}
            placeholder="Add specific guidelines, formula sheets, or formatting constraints..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
          />
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center justify-between pt-2 gap-3 border-t border-slate-100 dark:border-dark-border">
          <div className="text-xs text-slate-500">
            Deliverable: <strong className="text-purple-700 dark:text-brand-lavender">{selectedDocType}</strong> for{' '}
            <strong className="text-slate-800 dark:text-slate-200">{courseName}</strong>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Academic {selectedDocType}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Synthesize {selectedDocType}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Live A4 Document Preview Canvas */}
      {generatedDoc && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden animate-scale-in">
          {/* Action Ribbon */}
          <div className="p-4 bg-slate-50 dark:bg-dark-bg/60 border-b border-slate-200 dark:border-dark-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 truncate">
              <GraduationCap className="w-5 h-5 text-purple-600 dark:text-brand-lavender shrink-0" />
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                {generatedDoc.title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/editor/${generatedDoc.id}`}
                className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-200" />
                <span>Open in Word Editor</span>
              </Link>

              <button
                onClick={() => handleExport('pdf')}
                disabled={downloadingFormat === 'pdf'}
                className="inline-flex items-center space-x-1 text-xs font-bold bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
              >
                {downloadingFormat === 'pdf' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-purple-600 dark:text-brand-lavender" />
                )}
                <span>PDF</span>
              </button>

              <button
                onClick={() => handleExport('docx')}
                disabled={downloadingFormat === 'docx'}
                className="inline-flex items-center space-x-1 text-xs font-bold bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
              >
                {downloadingFormat === 'docx' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>DOCX</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-dark-border"
                title="Copy Markdown"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Document Content Canvas */}
          <div className="p-8 max-h-[800px] overflow-y-auto bg-white dark:bg-dark-surface">
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm font-body leading-relaxed space-y-4">
              {generatedDoc.content.split('\n').map((line: string, i: number) => {
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={i} className="font-display font-extrabold text-xl sm:text-2xl text-purple-950 dark:text-brand-lavender pb-2 border-b border-slate-200 dark:border-dark-border mt-4">
                      {line.replace('# ', '')}
                    </h1>
                  );
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={i} className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white pt-3">
                      {line.replace('## ', '')}
                    </h2>
                  );
                }
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={i} className="font-display font-semibold text-sm sm:text-base text-purple-800 dark:text-brand-lavender pt-2">
                      {line.replace('### ', '')}
                    </h3>
                  );
                }
                if (line.startsWith('> ')) {
                  return (
                    <blockquote key={i} className="p-3 bg-purple-50 dark:bg-brand-amethyst/30 border-l-4 border-purple-600 dark:border-brand-lavender rounded-r-xl text-slate-800 dark:text-slate-200 italic my-2">
                      {line.replace('> ', '')}
                    </blockquote>
                  );
                }
                if (line.includes('[PAGE BREAK]')) {
                  return (
                    <div key={i} className="py-4 my-6 flex items-center justify-center border-t-2 border-dashed border-purple-300 dark:border-brand-lavender/30 text-[10px] font-mono uppercase tracking-widest text-purple-700 dark:text-brand-lavender">
                      <span>— A4 Page Boundary —</span>
                    </div>
                  );
                }
                if (line.startsWith('[TEMPLATE_BADGE]')) {
                  return (
                    <div key={i} className="inline-block bg-purple-100 dark:bg-brand-amethyst text-purple-800 dark:text-brand-lavender px-3 py-1 rounded-full text-xs font-bold mb-2">
                      {line.replace('[TEMPLATE_BADGE]', '').trim()}
                    </div>
                  );
                }
                if (line.trim() === '---') {
                  return <hr key={i} className="border-slate-200 dark:border-dark-border my-4" />;
                }
                if (line.startsWith('- ')) {
                  return (
                    <li key={i} className="ml-4 list-disc text-slate-700 dark:text-slate-300">
                      {line.replace('- ', '')}
                    </li>
                  );
                }
                if (line.trim().length === 0) {
                  return <div key={i} className="h-1.5" />;
                }
                return (
                  <p key={i} className="text-slate-800 dark:text-slate-200">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Past Faculty Documents History Library */}
      {pastFacultyDocs.length > 0 && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
            <span>Your Saved Faculty Documents ({pastFacultyDocs.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastFacultyDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/40 flex flex-col justify-between space-y-3 hover:border-purple-400 transition-all"
              >
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Created {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60 dark:border-dark-border">
                  <button
                    onClick={() => handleLoadPastDoc(doc)}
                    className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1"
                  >
                    <span>View in Canvas</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <Link
                    href={`/editor/${doc.id}`}
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-dark-border"
                    title="Edit in Word Editor"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
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
