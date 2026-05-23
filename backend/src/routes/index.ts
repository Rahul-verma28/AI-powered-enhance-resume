import { Router } from 'express';
import resumeRoutes from './resume.routes';
import jobRoutes from './job.routes';
import coverLetterRoutes from './coverLetter.routes';
import atsRoutes from './ats.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ResumeAI Pro API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount route groups
router.use('/resume', resumeRoutes);
router.use('/jobs', jobRoutes);
router.use('/cover-letter', coverLetterRoutes);
router.use('/ats', atsRoutes);

export default router;
