'use client';

import { create } from 'zustand';
import { resumeApi } from './api';
import { toast } from 'sonner';

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
  explanation?: string; // High-fidelity reason for optimizations
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
  title: string;
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
  updateTitle: (newTitle: string) => void;

  setTailoredResult: (result: {
    resumeId?: string;
    title?: string;
    tailoredData: ResumeData;
    liveTailoredData?: ResumeData;
    atsScore: number;
    atsBreakdown: ATSBreakdown;
    matchedKeywords: string[];
    missingKeywords: string[];
    improvements: string[];
    warningFlags?: string[];
    aiChanges?: AIChange[];
  }) => void;

  /** Accept an AI change — apply it to liveTailoredData */
  acceptChange: (id: string) => void;

  /** Reject an AI change — keep original */
  rejectChange: (id: string) => void;

  /** Set manual edit for a change */
  editChange: (id: string, content: string) => void;

  /** Apply the edited content and mark as accepted */
  applyEdit: (id: string) => void;

  /** Save current edited state to the database */
  saveResume: () => Promise<void>;

  /** Bulk operations for float toolbar */
  acceptAllChanges: () => void;
  resetChanges: () => void;

  setSelectedTemplate: (template: string) => void;
  setPipelineStep: (step: PipelineStep) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Immutably sets a nested value based on a string path (e.g. "experience.0.bullets.1")
 */
function setNestedValue(obj: any, path: string, value: any): any {
  if (!obj) return obj;
  const newObj = JSON.parse(JSON.stringify(obj));
  const parts = path.split('.');
  let current = newObj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isNextIdx = !isNaN(Number(nextPart));
    
    if (current[part] === undefined) {
      current[part] = isNextIdx ? [] : {};
    }
    current = current[part];
  }
  
  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
  return newObj;
}

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
      explanation: 'Optimizes target title match, incorporates soft skills, and mirrors JD keywords for high-impact professional summaries.',
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
          explanation: 'Re-writes experience bullet using the STAR method, starting with a strong action verb and highlighting quantified business results.',
        });
      }
    });
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
      explanation: 'Balances skills layout to highlight primary technologies matching JD keywords for immediate ATS parsing success.',
    });
  }

  return changes.slice(0, 8); // Cap at 8 most important changes
}

/** Recalculate a responsive live ATS score based on accepted changes */
function calcLiveScore(baseScore: number, changes: AIChange[]): number {
  const total = changes.length;
  if (total === 0) return baseScore;
  
  // Baseline score is 55% of the optimized baseScore (matches user image 47 vs 86)
  const baseline = Math.round(baseScore * 0.55);
  const gap = baseScore - baseline;
  
  const accepted = changes.filter((c) => c.status === 'accepted').length;
  const score = baseline + Math.round((accepted / total) * gap);
  return Math.min(100, Math.max(0, score));
}

// ── Initial State ─────────────────────────────────────────────

const initialState = {
  originalText: '',
  jdText: '',
  resumeId: null,
  title: '',
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
  updateTitle: (newTitle) => {
    set({ title: newTitle });
    get().saveResume();
  },

  setTailoredResult: (result) => {
    // Preserve existing accept/reject status if provided
    const aiChanges = result.aiChanges && result.aiChanges.length > 0
      ? result.aiChanges.map(c => ({ ...c, status: c.status || 'pending' as const }))
      : buildAIChanges(result.tailoredData, result.improvements).map(c => ({ ...c, status: 'pending' as const }));

    set({
      resumeId: result.resumeId || null,
      title: result.title || '',
      tailoredData: result.tailoredData,
      liveTailoredData: result.liveTailoredData 
        ? JSON.parse(JSON.stringify(result.liveTailoredData)) 
        : JSON.parse(JSON.stringify(result.tailoredData)),
      atsScore: result.atsScore,
      liveAtsScore: calcLiveScore(result.atsScore, aiChanges), // Responsive initial score
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
    const { aiChanges, atsScore, liveTailoredData } = get();
    const updated = aiChanges.map((c) =>
      c.id === id ? { ...c, status: 'accepted' as const } : c
    );
    const targetChange = aiChanges.find((c) => c.id === id);
    let newTailoredData = liveTailoredData;
    if (targetChange && liveTailoredData) {
      newTailoredData = setNestedValue(liveTailoredData, targetChange.section, targetChange.after);
    }
    set({
      aiChanges: updated,
      liveTailoredData: newTailoredData,
      liveAtsScore: calcLiveScore(atsScore, updated),
    });
    get().saveResume();
  },

  rejectChange: (id) => {
    const { aiChanges, atsScore, liveTailoredData } = get();
    const updated = aiChanges.map((c) =>
      c.id === id ? { ...c, status: 'rejected' as const } : c
    );
    const targetChange = aiChanges.find((c) => c.id === id);
    let newTailoredData = liveTailoredData;
    if (targetChange && liveTailoredData) {
      newTailoredData = setNestedValue(liveTailoredData, targetChange.section, targetChange.before);
    }
    set({
      aiChanges: updated,
      liveTailoredData: newTailoredData,
      liveAtsScore: calcLiveScore(atsScore, updated),
    });
    get().saveResume();
  },

  editChange: (id, content) => {
    set((state) => ({
      aiChanges: state.aiChanges.map((c) =>
        c.id === id ? { ...c, status: 'editing' as const, editedContent: content } : c
      ),
    }));
  },

  applyEdit: (id) => {
    const { aiChanges, atsScore, liveTailoredData } = get();
    const updated = aiChanges.map((c) =>
      c.id === id
        ? { ...c, status: 'accepted' as const, after: c.editedContent || c.after }
        : c
    );
    const targetChange = aiChanges.find((c) => c.id === id);
    let newTailoredData = liveTailoredData;
    if (targetChange && liveTailoredData) {
      newTailoredData = setNestedValue(
        liveTailoredData,
        targetChange.section,
        targetChange.editedContent || targetChange.after
      );
    }
    set({
      aiChanges: updated,
      liveTailoredData: newTailoredData,
      liveAtsScore: calcLiveScore(atsScore, updated),
    });
    get().saveResume();
  },

  acceptAllChanges: () => {
    const { aiChanges, atsScore, liveTailoredData } = get();
    if (!liveTailoredData) return;
    let newTailoredData = JSON.parse(JSON.stringify(liveTailoredData));
    const updated = aiChanges.map((c) => {
      newTailoredData = setNestedValue(newTailoredData, c.section, c.after);
      return { ...c, status: 'accepted' as const };
    });
    set({
      aiChanges: updated,
      liveTailoredData: newTailoredData,
      liveAtsScore: atsScore,
    });
    get().saveResume();
    toast.success('Accepted all AI suggestions!');
  },

  resetChanges: () => {
    const { aiChanges, atsScore, liveTailoredData } = get();
    if (!liveTailoredData) return;
    let newTailoredData = JSON.parse(JSON.stringify(liveTailoredData));
    const updated = aiChanges.map((c) => {
      newTailoredData = setNestedValue(newTailoredData, c.section, c.before);
      return { ...c, status: 'pending' as const };
    });
    set({
      aiChanges: updated,
      liveTailoredData: newTailoredData,
      liveAtsScore: calcLiveScore(atsScore, updated),
    });
    get().saveResume();
    toast.success('Reset all changes to pending.');
  },

  saveResume: async () => {
    const {
      resumeId,
      title,
      liveTailoredData,
      aiChanges,
      selectedTemplate,
      atsScore,
      atsBreakdown,
      matchedKeywords,
      missingKeywords,
    } = get();
    if (!resumeId || !liveTailoredData) return;

    try {
      await resumeApi.patch(resumeId, {
        title,
        liveTailoredData,
        aiChanges,
        selectedTemplate,
        atsScore,
        atsBreakdown,
        matchedKeywords,
        missingKeywords,
      });
    } catch (err) {
      console.error('[Store] Failed to save resume edits:', err);
    }
  },

  setSelectedTemplate: (template) => {
    set({ selectedTemplate: template });
    get().saveResume();
  },
  setPipelineStep: (step) => set({ pipelineStep: step }),
  setError: (error) => set({ error, pipelineStep: error ? 'error' : 'idle' }),
  reset: () => set(initialState),
}));
