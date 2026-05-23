'use client';

import { create } from 'zustand';

// ── Types ────────────────────────────────────────────────────

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

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: ExperienceEntry[];
  skills: {
    technical: string[];
    tools: string[];
    soft: string[];
  };
  education: Array<{
    degree: string;
    school: string;
    year: string;
    gpa?: string;
  }>;
  certifications: string[];
  projects: Array<{
    name: string;
    description: string;
    tech: string[];
    link?: string;
  }>;
}

export interface ATSBreakdown {
  keywordScore: number;
  sectionScore: number;
  bulletQuality: number;
  formattingScore: number;
  lengthScore: number;
}

/** An AI-suggested improvement with before/after state */
export interface AIChange {
  id: string;
  section: string; // 'summary' | 'experience.0.bullets.1' | 'skills' etc.
  label: string;   // Human-readable label e.g. "Summary rewrite"
  before: string;
  after: string;
  status: 'pending' | 'accepted' | 'rejected' | 'editing';
  editedContent?: string; // When user manually edits the "after"
}

export type PipelineStep =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'analyzing'
  | 'rewriting'
  | 'scoring'
  | 'done'
  | 'error';

// ── Store Interface ──────────────────────────────────────────

interface AppState {
  // Resume tailoring state
  originalText: string;
  jdText: string;
  resumeId: string | null;
  tailoredData: ResumeData | null;
  liveTailoredData: ResumeData | null; // Live-edited version as user accepts/rejects changes
  atsScore: number;
  liveAtsScore: number; // Dynamically adjusts as changes are accepted
  atsBreakdown: ATSBreakdown | null;
  matchedKeywords: string[];
  missingKeywords: string[];
  improvements: string[];
  warningFlags: string[];
  aiChanges: AIChange[];
  selectedTemplate: string;
  pipelineStep: PipelineStep;
  error: string | null;

  // Actions
  setOriginalText: (text: string) => void;
  setJdText: (text: string) => void;
  setResumeId: (id: string | null) => void;

  setTailoredResult: (result: {
    resumeId?: string;
    tailoredData: ResumeData;
    atsScore: number;
    atsBreakdown: ATSBreakdown;
    matchedKeywords: string[];
    missingKeywords: string[];
    improvements: string[];
    warningFlags?: string[];
  }) => void;

  /** Accept an AI change — apply it to liveTailoredData */
  acceptChange: (id: string) => void;

  /** Reject an AI change — keep original */
  rejectChange: (id: string) => void;

  /** Set manual edit for a change */
  editChange: (id: string, content: string) => void;

  /** Apply the edited content and mark as accepted */
  applyEdit: (id: string) => void;

  setSelectedTemplate: (template: string) => void;
  setPipelineStep: (step: PipelineStep) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Build structured AI changes from improvements list and before/after data.
 * This creates the change cards the user can accept/reject.
 */
function buildAIChanges(
  originalTailoredData: ResumeData,
  improvements: string[]
): AIChange[] {
  const changes: AIChange[] = [];
  let id = 0;

  // Summary change
  if (originalTailoredData.summary) {
    changes.push({
      id: `change-${id++}`,
      section: 'summary',
      label: 'Professional Summary',
      before: '(original summary — accept to apply AI version)',
      after: originalTailoredData.summary,
      status: 'pending',
    });
  }

  // Experience bullet changes
  originalTailoredData.experience?.forEach((exp, expIdx) => {
    exp.bullets?.forEach((bullet, bulletIdx) => {
      if (bullet.length > 40) {
        changes.push({
          id: `change-${id++}`,
          section: `experience.${expIdx}.bullets.${bulletIdx}`,
          label: `${exp.title} at ${exp.company} — Bullet ${bulletIdx + 1}`,
          before: '(original bullet)',
          after: bullet,
          status: 'pending',
        });
      }
    });
    return changes;
  });

  // Skills enhancement
  if (originalTailoredData.skills?.technical?.length) {
    changes.push({
      id: `change-${id++}`,
      section: 'skills',
      label: 'Technical Skills (ATS-optimized)',
      before: '(original skills)',
      after: originalTailoredData.skills.technical.join(', '),
      status: 'pending',
    });
  }

  return changes.slice(0, 8); // Cap at 8 most important changes
}

/** Recalculate a rough live ATS score based on accepted changes */
function calcLiveScore(baseScore: number, changes: AIChange[]): number {
  const total = changes.length;
  if (total === 0) return baseScore;
  const accepted = changes.filter((c) => c.status === 'accepted').length;
  const rejected = changes.filter((c) => c.status === 'rejected').length;

  // Each accepted change adds up to ~2pts, each rejected subtracts ~1pt
  const delta = accepted * 2 - rejected * 1;
  return Math.min(100, Math.max(0, baseScore + delta));
}

// ── Initial State ─────────────────────────────────────────────

const initialState = {
  originalText: '',
  jdText: '',
  resumeId: null,
  tailoredData: null,
  liveTailoredData: null,
  atsScore: 0,
  liveAtsScore: 0,
  atsBreakdown: null,
  matchedKeywords: [],
  missingKeywords: [],
  improvements: [],
  warningFlags: [],
  aiChanges: [],
  selectedTemplate: 'modern',
  pipelineStep: 'idle' as PipelineStep,
  error: null,
};

// ── Store ─────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setOriginalText: (text) => set({ originalText: text }),
  setJdText: (text) => set({ jdText: text }),
  setResumeId: (id) => set({ resumeId: id }),

  setTailoredResult: (result) => {
    const aiChanges = buildAIChanges(result.tailoredData, result.improvements);
    set({
      resumeId: result.resumeId || null,
      tailoredData: result.tailoredData,
      liveTailoredData: { ...result.tailoredData },
      atsScore: result.atsScore,
      liveAtsScore: result.atsScore,
      atsBreakdown: result.atsBreakdown,
      matchedKeywords: result.matchedKeywords || [],
      missingKeywords: result.missingKeywords,
      improvements: result.improvements,
      warningFlags: result.warningFlags || [],
      aiChanges,
      pipelineStep: 'done',
    });
  },

  acceptChange: (id) => {
    const { aiChanges, atsScore } = get();
    const updated = aiChanges.map((c) =>
      c.id === id ? { ...c, status: 'accepted' as const } : c
    );
    set({
      aiChanges: updated,
      liveAtsScore: calcLiveScore(atsScore, updated),
    });
  },

  rejectChange: (id) => {
    const { aiChanges, atsScore } = get();
    const updated = aiChanges.map((c) =>
      c.id === id ? { ...c, status: 'rejected' as const } : c
    );
    set({
      aiChanges: updated,
      liveAtsScore: calcLiveScore(atsScore, updated),
    });
  },

  editChange: (id, content) => {
    set((state) => ({
      aiChanges: state.aiChanges.map((c) =>
        c.id === id ? { ...c, status: 'editing' as const, editedContent: content } : c
      ),
    }));
  },

  applyEdit: (id) => {
    const { aiChanges, atsScore } = get();
    const updated = aiChanges.map((c) =>
      c.id === id
        ? { ...c, status: 'accepted' as const, after: c.editedContent || c.after }
        : c
    );
    set({
      aiChanges: updated,
      liveAtsScore: calcLiveScore(atsScore, updated),
    });
  },

  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setPipelineStep: (step) => set({ pipelineStep: step }),
  setError: (error) => set({ error, pipelineStep: error ? 'error' : 'idle' }),
  reset: () => set(initialState),
}));
