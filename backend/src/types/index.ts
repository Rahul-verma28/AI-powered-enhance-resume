// ─── Resume Types ───────────────────────────────────────────

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  location?: string;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  dates: string;
  location?: string;
  bullets: string[];
}

export interface EducationEntry {
  degree: string;
  school: string;
  year: string;
  gpa?: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  tech: string[];
  link?: string;
}

export interface SkillSet {
  technical: string[];
  tools: string[];
  soft: string[];
}

export interface TailoredResumeData {
  contact: ContactInfo;
  summary: string;
  experience: ExperienceEntry[];
  skills: SkillSet;
  education: EducationEntry[];
  certifications: string[];
  projects: ProjectEntry[];
}

// ─── ATS Score Types ────────────────────────────────────────

export interface ATSBreakdown {
  keywordScore: number;       // 40% weight
  sectionScore: number;       // 20% weight
  bulletQuality: number;      // 20% weight
  formattingScore: number;    // 10% weight
  lengthScore: number;        // 10% weight
}

export interface ATSResult {
  total: number;
  breakdown: ATSBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
}

// ─── AI Types ───────────────────────────────────────────────

export type AIProvider = 'ollama' | 'claude' | 'openai' | 'bedrock';

export interface AICallOptions {
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
}

// ─── Rewrite Pipeline Types ────────────────────────────────

export interface JDAnalysis {
  keywords: string[];
  requirements: string[];
  industry: string;
  seniorityLevel: string;
  jobTitle: string;
  company?: string;
}

export interface GapAnalysis {
  matchedKeywords: string[];
  missingKeywords: string[];
  missingSkills: string[];
  missingSections: string[];
  suggestions: string[];
}

export interface AIChange {
  id: string;
  section: string; // 'summary' | 'experience.0.bullets.1' | 'skills' etc.
  label: string;   // Human-readable label
  before: string;
  after: string;
  status: 'pending' | 'accepted' | 'rejected' | 'editing';
  editedContent?: string;
}

export type JobPriority = 'low' | 'medium' | 'high';

export interface RewriteResult {
  tailoredData: TailoredResumeData;
  atsScore: number;
  atsBreakdown: ATSBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  improvements: string[];
  warningFlags: string[];
  aiChanges?: AIChange[];
}

// ─── Cover Letter Types ─────────────────────────────────────

export type CoverLetterTone = 'professional' | 'confident' | 'concise' | 'friendly';

export interface CoverLetterResult {
  content: string;
  subject: string;
  tone: CoverLetterTone;
}

// ─── Job Types ──────────────────────────────────────────────

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

// ─── Resume Status Types ────────────────────────────────────

export type ResumeStatus = 'processing' | 'done' | 'failed';

// ─── Template Types ─────────────────────────────────────────

export type TemplateId = 'classic' | 'modern' | 'minimal' | 'executive' | 'tech';

// ─── API Response Types ─────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Pagination ─────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
