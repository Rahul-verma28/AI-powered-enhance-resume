import { Request, Response, NextFunction } from 'express';
import { Job } from '../models';
import { AppError } from '../middleware';
import { callAIJSON } from '../services';
import { JD_PARSE_SYSTEM_PROMPT, buildJDParsePrompt } from '../prompts';

/**
 * Job Controller — handles job tracking endpoints.
 */
export class JobController {
  /**
   * POST /api/jobs
   * Save a new job description and extract keywords via AI.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { company, jobTitle, jdRaw, applicationUrl, notes } = req.body;

      // Extract keywords from JD using AI
      let jdKeywords: string[] = [];
      let jdRequirements: string[] = [];
      let industry = '';
      let seniorityLevel = '';

      try {
        const prompt = buildJDParsePrompt(jdRaw);
        const analysis = await callAIJSON<any>(prompt, JD_PARSE_SYSTEM_PROMPT);
        jdKeywords = analysis.keywords || [];
        jdRequirements = analysis.requirements || [];
        industry = analysis.industry || '';
        seniorityLevel = analysis.seniorityLevel || '';
      } catch (err) {
        console.warn('JD parsing failed, saving without keywords:', (err as Error).message);
      }

      const job = await Job.create({
        userId,
        company,
        jobTitle,
        jdRaw,
        jdKeywords,
        jdRequirements,
        industry,
        seniorityLevel,
        applicationUrl,
        notes,
      });

      res.status(201).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jobs
   * List all jobs for current user.
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const skip = (page - 1) * limit;

      const filter: any = { userId };
      if (status) filter.applicationStatus = status;

      const [jobs, total] = await Promise.all([
        Job.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Job.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          items: jobs,
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
   * GET /api/jobs/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const job = await Job.findOne({ _id: req.params.id, userId });

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/jobs/:id/status
   * Update application status.
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { applicationStatus, notes } = req.body;

      const job = await Job.findOneAndUpdate(
        { _id: req.params.id, userId },
        {
          applicationStatus,
          ...(notes !== undefined && { notes }),
          ...(applicationStatus === 'applied' && { appliedAt: new Date() }),
        },
        { new: true }
      );

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/jobs/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const job = await Job.findOneAndDelete({ _id: req.params.id, userId });

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      res.json({ success: true, message: 'Job deleted' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jobs/stats
   * Dashboard stats for job tracking.
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;

      const stats = await Job.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$applicationStatus',
            count: { $sum: 1 },
          },
        },
      ]);

      const statusMap: Record<string, number> = {};
      let totalJobs = 0;
      for (const stat of stats) {
        statusMap[stat._id] = stat.count;
        totalJobs += stat.count;
      }

      res.json({
        success: true,
        data: {
          total: totalJobs,
          saved: statusMap['saved'] || 0,
          applied: statusMap['applied'] || 0,
          interview: statusMap['interview'] || 0,
          offer: statusMap['offer'] || 0,
          rejected: statusMap['rejected'] || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const jobController = new JobController();
