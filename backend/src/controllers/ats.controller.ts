import { Request, Response, NextFunction } from 'express';
import { Resume } from '../models';
import { atsScorer } from '../services';
import { AppError } from '../middleware';

/**
 * ATS Controller — recalculate scores and provide breakdowns.
 */
export class ATSController {
  /**
   * GET /api/ats/score/:resumeId
   * Re-calculate and return ATS score breakdown.
   */
  async getScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const resume = await Resume.findOne({ _id: req.params.resumeId, userId })
        .populate('jobId');

      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      if (!resume.tailoredData) {
        throw new AppError('Resume has not been tailored yet', 400);
      }

      // Get JD keywords from associated job or from stored data
      const jdKeywords = (resume as any).jobId?.jdKeywords || [];

      const result = atsScorer.score(resume.tailoredData, jdKeywords);

      // Update the stored score
      resume.atsScore = result.total;
      resume.atsBreakdown = result.breakdown;
      resume.missingKeywords = result.missingKeywords;
      await resume.save();

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ats/dashboard-stats
   * Get aggregate ATS stats for the user's dashboard.
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;

      const stats = await Resume.aggregate([
        { $match: { userId, status: 'done', atsScore: { $exists: true } } },
        {
          $group: {
            _id: null,
            totalResumes: { $sum: 1 },
            avgScore: { $avg: '$atsScore' },
            bestScore: { $max: '$atsScore' },
            latestScore: { $last: '$atsScore' },
          },
        },
      ]);

      const result = stats[0] || {
        totalResumes: 0,
        avgScore: 0,
        bestScore: 0,
        latestScore: 0,
      };

      res.json({
        success: true,
        data: {
          totalResumes: result.totalResumes,
          avgScore: Math.round(result.avgScore || 0),
          bestScore: result.bestScore || 0,
          latestScore: result.latestScore || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const atsController = new ATSController();
