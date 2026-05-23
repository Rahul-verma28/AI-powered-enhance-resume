import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ApplicationStatus } from '../types';

export interface IJob extends Document {
  userId: string;
  company: string;
  jobTitle: string;
  jdRaw: string;
  jdKeywords: string[];
  jdRequirements: string[];
  industry: string;
  seniorityLevel: string;
  applicationStatus: ApplicationStatus;
  applicationUrl?: string;
  notes?: string;
  appliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    jdRaw: {
      type: String,
      required: true,
    },
    jdKeywords: {
      type: [String],
      default: [],
    },
    jdRequirements: {
      type: [String],
      default: [],
    },
    industry: {
      type: String,
      default: '',
    },
    seniorityLevel: {
      type: String,
      default: '',
    },
    applicationStatus: {
      type: String,
      enum: ['saved', 'applied', 'interview', 'offer', 'rejected'],
      default: 'saved',
    },
    applicationUrl: { type: String },
    notes: { type: String },
    appliedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for efficient user-specific queries
JobSchema.index({ userId: 1, createdAt: -1 });
JobSchema.index({ userId: 1, applicationStatus: 1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);
