// Shared TypeScript definitions for EasyDoc

export type Role = 'USER' | 'ADMIN';
export type DocStatus = 'DRAFT' | 'COMPLETE';
export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'groq';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  plan: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  templateId?: string | null;
  projectId?: string | null;
  status: DocStatus;
  createdAt: string;
  updatedAt: string;
  template?: TemplateItem | null;
}

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  previewImage?: string | null;
  usageCount: number;
}

export interface AIRequestItem {
  id: string;
  userId: string;
  prompt: string;
  provider: AIProvider;
  responseTimeMs: number;
  success: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  message: string;
  type: 'success' | 'error' | 'info';
  isRead: boolean;
  createdAt: string;
}

export interface GenerateDocRequest {
  title: string;
  templateId?: string;
  projectId?: string;
  tone: string;
  instructions: string;
  provider: AIProvider;
}

export interface GenerateDocResponse {
  documentId: string;
  title: string;
  content: string;
  provider: AIProvider;
  responseTimeMs: number;
}

// -------------------------------------------------------------
// FEATURE 1: PROJECT DOCUMENTATION TYPES
// -------------------------------------------------------------
export interface ProjectModuleItem {
  id: string;
  name: string;
  description: string;
  features: string[];
  userRole: string;
}

export interface ProjectTechStack {
  languages: string[];
  frameworks: string[];
  database: string[];
  tools: string[];
}

export interface ProjectItem {
  id: string;
  userId: string;
  name: string;
  domain: string;
  description: string;
  problemStatement?: string | null;
  objectives?: string | null;
  targetUsers?: string | null;
  techStack?: ProjectTechStack | null;
  modules?: ProjectModuleItem[] | null;
  documents?: DocumentItem[];
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// FEATURE 2: PRESENTATION STUDIO TYPES
// -------------------------------------------------------------
export type PresentationStyle = 'Academic' | 'Corporate' | 'Minimal' | 'Technical' | 'Project Viva';

export interface SlideItem {
  id: string;
  slideNumber: number;
  title: string;
  subtitle?: string;
  bullets: string[];
  layout: 'title' | 'content' | 'split' | 'quote' | 'stats' | 'conclusion';
  notes?: string;
  chartOrTable?: {
    type: 'table' | 'bar' | 'pie';
    headers?: string[];
    rows?: string[][];
  };
}

export interface PresentationTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

export interface PresentationItem {
  id: string;
  userId: string;
  documentId?: string | null;
  title: string;
  style: PresentationStyle;
  slides: SlideItem[];
  theme?: PresentationTheme | null;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// FEATURE 3: VIVA STUDIO TYPES
// -------------------------------------------------------------
export type VivaDifficulty = 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
export type VivaCategory =
  | 'General'
  | 'Technical'
  | 'Architecture'
  | 'Database'
  | 'Programming'
  | 'Security'
  | 'Testing'
  | 'Deployment'
  | 'Project-specific';

export interface VivaQuestionItem {
  id: string;
  question: string;
  answer: string;
  difficulty: VivaDifficulty;
  category: VivaCategory;
  userAnswer?: string;
  score?: number;
  evaluation?: {
    score: number;
    correctPoints: string[];
    missingPoints: string[];
    suggestedImprovements: string[];
  };
}

export interface VivaSessionItem {
  id: string;
  userId: string;
  documentId?: string | null;
  projectId?: string | null;
  title: string;
  difficulty: VivaDifficulty;
  questions: VivaQuestionItem[];
  totalScore?: number | null;
  feedback?: {
    strongAreas: string[];
    weakAreas: string[];
    recommendedTopics: string[];
    overallComment: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// FEATURE 4: DOCUMENT HEALTH SCORE TYPES
// -------------------------------------------------------------
export interface HealthIssueItem {
  id: string;
  category: 'Structure' | 'Readability' | 'Grammar' | 'Professionalism' | 'Completeness' | 'Formatting';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestedFix: string;
  autoFixAction?: {
    type: 'append' | 'replace' | 'prepend' | 'format';
    target?: string;
    replacement?: string;
  };
}

export interface HealthReportItem {
  overallScore: number;
  structureScore: number;
  readabilityScore: number;
  grammarScore: number;
  professionalismScore: number;
  completenessScore: number;
  formattingScore: number;
  issues: HealthIssueItem[];
  calculatedAt: string;
}

// -------------------------------------------------------------
// FEATURE 5: DOCUMENT VERIFICATION TYPES
// -------------------------------------------------------------
export interface VerificationRecord {
  id: string;
  verificationId: string;
  documentId: string;
  userId: string;
  documentTitle: string;
  documentType: string;
  checksum: string;
  isRevoked: boolean;
  issuedAt: string;
  revokedAt?: string | null;
  scanCount: number;
}

// -------------------------------------------------------------
// FEATURE 7: CAREER STUDIO / ATS TYPES
// -------------------------------------------------------------
export interface EducationEntry {
  degree: string;
  institution: string;
  location?: string;
  year: string;
  gpaOrScore?: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location?: string;
  responsibilities: string[];
  achievements?: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  achievements: string[];
  url?: string;
}

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    gitHub?: string;
    portfolio?: string;
  };
  summary: string;
  targetRole: string;
  skills: {
    programmingLanguages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    softSkills: string[];
  };
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: string[];
  internships?: string[];
  achievements?: string[];
  publications?: string[];
  languages?: string[];
}

export interface ATSAnalysisResult {
  atsScore: number;
  formattingScore: number;
  keywordScore: number;
  skillsScore: number;
  experienceScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

// -------------------------------------------------------------
// DOCUMENT CHAT / RAG TYPES
// -------------------------------------------------------------
export interface DocumentChunk {
  id: string;
  chunkIndex: number;
  sectionTitle: string;
  content: string;
  wordCount: number;
}

export interface DocumentSourceReference {
  chunkIndex: number;
  sectionTitle: string;
  snippet: string;
  relevanceScore: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: DocumentSourceReference[];
  timestamp: string;
  isAvailable?: boolean;
}

export interface DocExtractResponse {
  success: boolean;
  documentTitle: string;
  fileType: string;
  totalWords: number;
  chunkCount: number;
  chunks: DocumentChunk[];
  suggestedQuestions: string[];
}

export interface DocChatQueryResponse {
  success: boolean;
  answer: string;
  relevantSources: DocumentSourceReference[];
  isAvailable: boolean;
}

