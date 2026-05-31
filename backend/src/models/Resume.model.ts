import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  TailoredResumeData,
  ATSBreakdown,
  ResumeStatus,
  TemplateId,
  AIChange,
} from '../types';

export interface IResume extends Document {
  userId: string;
  jobId?: Types.ObjectId;
  title: string;
  originalText: string;
  jdText?: string;
  originalUrl?: string;
  originalFileName?: string;
  tailoredData?: TailoredResumeData;
  liveTailoredData?: TailoredResumeData;
  aiChanges: AIChange[];
  atsScore?: number;
  atsBreakdown?: ATSBreakdown;
  missingKeywords: string[];
  matchedKeywords: string[];
  improvements: string[];
  warningFlags: string[];
  selectedTemplate: TemplateId;
  generatedPdfUrl?: string;
  version: number;
  parentVersion?: Types.ObjectId;
  status: ResumeStatus;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TailoredDataSchema = new Schema(
  {
    contact: {
      name: String,
      email: String,
      phone: String,
      linkedin: String,
      github: String,
      location: String,
    },
    summary: String,
    experience: [
      {
        company: String,
        title: String,
        dates: String,
        location: String,
        bullets: [String],
      },
    ],
    skills: {
      technical: [String],
      tools: [String],
      soft: [String],
    },
    education: [
      {
        degree: String,
        school: String,
        year: String,
        gpa: String,
      },
    ],
    certifications: [String],
    projects: [
      {
        name: String,
        description: String,
        tech: [String],
        link: String,
      },
    ],
  },
  { _id: false }
);

const AIChangeSchema = new Schema(
  {
    id: { type: String, required: true },
    section: { type: String, required: true },
    label: { type: String, required: true },
    before: { type: String, required: true },
    after: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'editing'],
      default: 'pending',
    },
    editedContent: { type: String },
    explanation: { type: String },
  },
  { _id: false }
);

const ATSBreakdownSchema = new Schema(
  {
    keywordScore: { type: Number, default: 0 },
    sectionScore: { type: Number, default: 0 },
    bulletQuality: { type: Number, default: 0 },
    formattingScore: { type: Number, default: 0 },
    lengthScore: { type: Number, default: 0 },
  },
  { _id: false }
);

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalText: {
      type: String,
      required: true,
    },
    jdText: { type: String },
    originalUrl: { type: String },
    originalFileName: { type: String },
    tailoredData: { type: TailoredDataSchema },
    liveTailoredData: { type: TailoredDataSchema },
    aiChanges: { type: [AIChangeSchema], default: [] },
    atsScore: { type: Number, min: 0, max: 100 },
    atsBreakdown: { type: ATSBreakdownSchema },
    missingKeywords: { type: [String], default: [] },
    matchedKeywords: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    warningFlags: { type: [String], default: [] },
    selectedTemplate: {
      type: String,
      enum: ['classic', 'modern', 'minimal', 'executive', 'tech'],
      default: 'modern',
    },
    generatedPdfUrl: { type: String },
    version: { type: Number, default: 1 },
    parentVersion: { type: Schema.Types.ObjectId, ref: 'Resume' },
    status: {
      type: String,
      enum: ['processing', 'done', 'failed'],
      default: 'processing',
    },
    processingStartedAt: { type: Date },
    processingCompletedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for efficient queries
ResumeSchema.index({ userId: 1, createdAt: -1 });
ResumeSchema.index({ userId: 1, jobId: 1 });
ResumeSchema.index({ userId: 1, status: 1 });

export const Resume = mongoose.model<IResume>('Resume', ResumeSchema);
