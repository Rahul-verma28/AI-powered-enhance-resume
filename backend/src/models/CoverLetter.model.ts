import mongoose, { Schema, Document, Types } from 'mongoose';
import type { CoverLetterTone } from '../types';

export interface ICoverLetter extends Document {
  userId: string;
  resumeId?: Types.ObjectId;
  jobId?: Types.ObjectId;
  content: string;
  subject?: string;
  tone: CoverLetterTone;
  company?: string;
  jobTitle?: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CoverLetterSchema = new Schema<ICoverLetter>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: false,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: false,
    },
    content: {
      type: String,
      required: true,
    },
    subject: { type: String, default: '' },
    tone: {
      type: String,
      enum: ['professional', 'confident', 'concise', 'friendly'],
      default: 'professional',
    },
    company: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    pdfUrl: { type: String },
  },
  { timestamps: true }
);

CoverLetterSchema.index({ userId: 1, createdAt: -1 });

export const CoverLetter = mongoose.model<ICoverLetter>(
  'CoverLetter',
  CoverLetterSchema
);
