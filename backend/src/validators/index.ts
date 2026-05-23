import { z } from 'zod';

// ─── Resume Validation Schemas ──────────────────────────────

export const tailorResumeSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters').optional(),
  resumeId: z.string().optional(),
  jdText: z.string().min(50, 'Job description must be at least 50 characters'),
  company: z.string().min(1, 'Company name is required').optional(),
  jobTitle: z.string().min(1, 'Job title is required').optional(),
});

export const downloadResumeSchema = z.object({
  template: z.enum(['classic', 'modern', 'minimal', 'executive', 'tech']).default('modern'),
});

// ─── Job Validation Schemas ─────────────────────────────────

export const createJobSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(200),
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  jdRaw: z.string().min(50, 'Job description must be at least 50 characters'),
  applicationUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
});

export const updateJobStatusSchema = z.object({
  applicationStatus: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected']),
  notes: z.string().max(2000).optional(),
});

// ─── Cover Letter Schemas ───────────────────────────────────

export const generateCoverLetterSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  jobId: z.string().min(1, 'Job ID is required'),
  tone: z.enum(['professional', 'enthusiastic', 'concise']).default('professional'),
});

// ─── Pagination Schema ─────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── ID Param Schema ────────────────────────────────────────

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});
