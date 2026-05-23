import { Request, Response, NextFunction } from 'express';
import { CoverLetter, Resume, Job } from '../models';
import { coverLetterGenerator } from '../services';
import { AppError } from '../middleware';
import { pdfGenerator } from '../services';
import type { CoverLetterTone } from '../types';

/**
 * Cover Letter Controller.
 */
export class CoverLetterController {
  /**
   * POST /api/cover-letter/generate
   * 
   * Supports two modes:
   * 1. resumeId + jobId — generate from saved resume & job
   * 2. resumeText + jdText + company + jobTitle — standalone (no saved records needed)
   */
  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { resumeId, jobId, tone, resumeText, jdText, company, jobTitle } = req.body;

      let resolvedResumeText = resumeText || '';
      let resolvedJdText = jdText || '';
      let resolvedCompany = company || '';
      let resolvedJobTitle = jobTitle || '';
      let resolvedResumeId = resumeId;
      let resolvedJobId = jobId;

      // Mode 1: fetch from DB
      if (resumeId) {
        const resume = await Resume.findOne({ _id: resumeId, userId });
        if (!resume) throw new AppError('Resume not found', 404);
        resolvedResumeText = resume.tailoredData
          ? JSON.stringify(resume.tailoredData, null, 2)
          : resume.originalText;
      }

      if (jobId) {
        const job = await Job.findOne({ _id: jobId, userId });
        if (!job) throw new AppError('Job not found', 404);
        resolvedJdText = job.jdRaw;
        resolvedCompany = job.company;
        resolvedJobTitle = job.jobTitle;
      }

      // Validate we have enough data
      if (!resolvedResumeText) throw new AppError('Resume content is required', 400);
      if (!resolvedJdText || resolvedJdText.length < 50) throw new AppError('Job description is required (min 50 chars)', 400);

      // Generate cover letter
      const result = await coverLetterGenerator.generate(
        resolvedResumeText,
        resolvedJdText,
        resolvedCompany,
        resolvedJobTitle,
        (tone || 'professional') as CoverLetterTone
      );

      // Save to DB (only when linked to saved records)
      const coverLetter = await CoverLetter.create({
        userId,
        resumeId: resolvedResumeId || undefined,
        jobId: resolvedJobId || undefined,
        content: result.content,
        subject: result.subject || `Application for ${resolvedJobTitle} at ${resolvedCompany}`,
        tone: result.tone,
        company: resolvedCompany,
        jobTitle: resolvedJobTitle,
      });

      res.status(201).json({ success: true, data: coverLetter });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/cover-letter/:id
   * Update content (user edits).
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { content } = req.body;

      const coverLetter = await CoverLetter.findOneAndUpdate(
        { _id: req.params.id, userId },
        { content },
        { new: true }
      );

      if (!coverLetter) throw new AppError('Cover letter not found', 404);
      res.json({ success: true, data: coverLetter });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/cover-letter/:id/download
   * Generate PDF from cover letter content.
   */
  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const coverLetter = await CoverLetter.findOne({ _id: req.params.id, userId });
      if (!coverLetter) throw new AppError('Cover letter not found', 404);

      const pdfBuffer = await pdfGenerator.generateCoverLetterPDF(
        coverLetter.content,
        coverLetter.subject || 'Cover Letter',
        coverLetter.company || '',
        coverLetter.jobTitle || ''
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cover-letter-${coverLetter._id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/cover-letter/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const coverLetter = await CoverLetter.findOne({ _id: req.params.id, userId })
        .populate('resumeId', 'title atsScore')
        .populate('jobId', 'company jobTitle');

      if (!coverLetter) throw new AppError('Cover letter not found', 404);
      res.json({ success: true, data: coverLetter });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/cover-letter
   * List all cover letters for current user.
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const coverLetters = await CoverLetter.find({ userId })
        .populate('jobId', 'company jobTitle')
        .sort({ createdAt: -1 })
        .lean();

      res.json({ success: true, data: coverLetters });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/cover-letter/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const coverLetter = await CoverLetter.findOneAndDelete({ _id: req.params.id, userId });
      if (!coverLetter) throw new AppError('Cover letter not found', 404);
      res.json({ success: true, message: 'Cover letter deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const coverLetterController = new CoverLetterController();
