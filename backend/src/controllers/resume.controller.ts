import { Request, Response, NextFunction } from 'express';
import { Resume } from '../models';
import { resumeParser, resumeRewriter, pdfGenerator, cloudinaryService, atsScorer } from '../services';
import { AppError } from '../middleware';
import type { TemplateId } from '../types';

/**
 * Resume Controller — handles all resume-related endpoints.
 */
export class ResumeController {
  /**
   * POST /api/resume/upload
   * Upload a PDF/DOCX file, parse text, store original in Cloudinary.
   */
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const userId = req.userId!;
      const { buffer, mimetype, originalname } = req.file;

      // Parse text from file
      const originalText = await resumeParser.parse(buffer, mimetype);

      // Upload original to Cloudinary
      let originalUrl = '';
      try {
        const uploadResult = await cloudinaryService.uploadBuffer(buffer, {
          folder: `originals/${userId}`,
          fileName: `${Date.now()}-${originalname}`,
        });
        originalUrl = uploadResult.url;
      } catch (err) {
        console.warn('Cloudinary upload skipped (not configured):', (err as Error).message);
      }

      // Save to DB
      const resume = await Resume.create({
        userId,
        title: originalname.replace(/\.[^/.]+$/, ''),
        originalText,
        originalUrl,
        originalFileName: originalname,
        status: 'done',
      });

      res.status(201).json({
        success: true,
        data: {
          id: resume._id,
          title: resume.title,
          originalText: resume.originalText,
          originalFileName: resume.originalFileName,
          createdAt: resume.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/resume/tailor
   * Core endpoint: JD + resume text/ID → full AI rewrite + ATS score.
   */
  async tailor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { resumeText, resumeId, jdText, company, jobTitle } = req.body;

      let text = resumeText;

      // If resumeId provided, fetch the original text
      if (resumeId && !text) {
        const existing = await Resume.findOne({ _id: resumeId, userId });
        if (!existing) {
          throw new AppError('Resume not found', 404);
        }
        text = existing.originalText;
      }

      if (!text) {
        throw new AppError('Resume text or resumeId is required', 400);
      }

      // Create a resume record in "processing" state
      const resume = await Resume.create({
        userId,
        title: jobTitle || company || 'Untitled Position',
        originalText: text,
        jdText,
        status: 'processing',
        processingStartedAt: new Date(),
      });

      try {
        // Run the AI pipeline
        const result = await resumeRewriter.tailorResume(text, jdText);

        // Update resume with results
        resume.tailoredData = result.tailoredData;
        resume.liveTailoredData = result.tailoredData;
        resume.aiChanges = result.aiChanges || [];
        resume.atsScore = result.atsScore;
        resume.atsBreakdown = result.atsBreakdown;
        resume.matchedKeywords = result.matchedKeywords || [];
        resume.missingKeywords = result.missingKeywords;
        resume.improvements = result.improvements;
        resume.warningFlags = result.warningFlags;
        resume.status = 'done';
        resume.processingCompletedAt = new Date();
        await resume.save();

        res.status(200).json({
          success: true,
          data: resume,
        });
      } catch (aiError) {
        // Mark as failed if AI pipeline errors
        resume.status = 'failed';
        await resume.save();
        throw aiError;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/resume/:id
   * Fetch a single tailored resume with all data.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const resume = await Resume.findOne({ _id: req.params.id, userId });

      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      res.json({ success: true, data: resume });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/resume/history
   * All resume versions for current user.
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [resumes, total] = await Promise.all([
        Resume.find({ userId })
          .select('title atsScore status selectedTemplate createdAt updatedAt originalFileName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Resume.countDocuments({ userId }),
      ]);

      res.json({
        success: true,
        data: {
          items: resumes,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/resume/:id/regenerate
   * Re-run AI with same JD, create a new version.
   */
  async regenerate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const original = await Resume.findOne({ _id: req.params.id, userId });

      if (!original) {
        throw new AppError('Resume not found', 404);
      }

      // Get associated job's JD if available
      const jdText = req.body.jdText;
      if (!jdText) {
        throw new AppError('Job description text is required for regeneration', 400);
      }

      const result = await resumeRewriter.tailorResume(original.originalText, jdText);

      const newResume = await Resume.create({
        userId,
        jobId: original.jobId,
        title: original.title,
        originalText: original.originalText,
        jdText,
        originalUrl: original.originalUrl,
        originalFileName: original.originalFileName,
        tailoredData: result.tailoredData,
        liveTailoredData: result.tailoredData,
        aiChanges: result.aiChanges || [],
        atsScore: result.atsScore,
        atsBreakdown: result.atsBreakdown,
        missingKeywords: result.missingKeywords,
        improvements: result.improvements,
        warningFlags: result.warningFlags,
        selectedTemplate: original.selectedTemplate,
        version: original.version + 1,
        parentVersion: original._id as any,
        status: 'done',
        processingStartedAt: new Date(),
        processingCompletedAt: new Date(),
      });

      res.status(201).json({ success: true, data: newResume });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/resume/:id/download/:template
   * Generate and return PDF in chosen template.
   */
  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const templateId = (req.params.template || 'modern') as TemplateId;

      const resume = await Resume.findOne({ _id: req.params.id, userId });
      if (!resume || (!resume.tailoredData && !resume.liveTailoredData)) {
        throw new AppError('Resume not found or not yet tailored', 404);
      }

      const activeData = resume.liveTailoredData || resume.tailoredData;
      const plainData = (activeData as any).toObject ? (activeData as any).toObject() : JSON.parse(JSON.stringify(activeData));
      const pdfBuffer = await pdfGenerator.generate(plainData, templateId);

      // Update selected template
      resume.selectedTemplate = templateId;
      await resume.save();

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resume.title}-${templateId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/resume/:id/ats-report
   * Compile and download a beautiful ATS optimization report PDF.
   */
  async downloadATSReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const resume = await Resume.findOne({ _id: req.params.id, userId });

      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      const score = resume.atsScore || 0;
      const breakdown = resume.atsBreakdown || {
        keywordScore: 0,
        sectionScore: 0,
        bulletQuality: 0,
        formattingScore: 0,
        lengthScore: 0
      };

      const plainBreakdown = (breakdown as any).toObject ? (breakdown as any).toObject() : JSON.parse(JSON.stringify(breakdown));

      const pdfBuffer = await pdfGenerator.generateATSReportPDF(
        resume.title || 'Untitled Profile',
        score,
        plainBreakdown,
        resume.matchedKeywords || [],
        resume.missingKeywords || [],
        resume.improvements || [],
        resume.warningFlags || []
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ats-report-${resume._id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/resume/:id
   * Update a resume's tailoredData, liveTailoredData, aiChanges, selectedTemplate, atsScore, atsBreakdown, missingKeywords, matchedKeywords.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { title, liveTailoredData, aiChanges, selectedTemplate, atsScore, atsBreakdown, matchedKeywords, missingKeywords } = req.body;

      const resume = await Resume.findOneAndUpdate(
        { _id: req.params.id, userId },
        {
          ...(title !== undefined && { title }),
          ...(liveTailoredData !== undefined && { liveTailoredData }),
          ...(aiChanges !== undefined && { aiChanges }),
          ...(selectedTemplate !== undefined && { selectedTemplate }),
          ...(atsScore !== undefined && { atsScore }),
          ...(atsBreakdown !== undefined && { atsBreakdown }),
          ...(matchedKeywords !== undefined && { matchedKeywords }),
          ...(missingKeywords !== undefined && { missingKeywords }),
        },
        { new: true }
      );

      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      res.json({ success: true, data: resume });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/resume/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId });

      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      res.json({ success: true, message: 'Resume deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const resumeController = new ResumeController();
