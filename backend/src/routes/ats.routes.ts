import { Router } from 'express';
import { atsController } from '../controllers';
import { requireAuth } from '../middleware';

const router = Router();

router.use(requireAuth);

// Get ATS score for a resume
router.get('/score/:resumeId', (req, res, next) =>
  atsController.getScore(req, res, next)
);

// Get dashboard stats
router.get('/dashboard-stats', (req, res, next) =>
  atsController.getDashboardStats(req, res, next)
);

export default router;
