import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  plan: 'free' | 'pro' | 'lifetime';
  creditsUsed: number;
  creditsLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      // Sparse index: only enforce uniqueness for non-empty emails
      index: { unique: true, sparse: true },
    },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    plan: {
      type: String,
      enum: ['free', 'pro', 'lifetime'],
      default: 'free',
    },
    creditsUsed: { type: Number, default: 0 },
    creditsLimit: { type: Number, default: 3 }, // Free tier: 3 resumes/month
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
