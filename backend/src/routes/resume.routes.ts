import { Router } from 'express';
import { resumeController } from '../controllers';
import { requireAuth, validate, upload } from '../middleware';
import { tailorResumeSchema } from '../validators';

const router = Router();

// All resume routes require authentication
router.use(requireAuth);

// Upload resume (PDF/DOCX)
router.post('/upload', upload.single('resume'), (req, res, next) =>
  resumeController.upload(req, res, next)
);

// Core tailoring endpoint
router.post('/tailor', validate(tailorResumeSchema), (req, res, next) =>
  resumeController.tailor(req, res, next)
);

// Resume history
router.get('/history', (req, res, next) =>
  resumeController.getHistory(req, res, next)
);

// Get single resume
router.get('/:id', (req, res, next) =>
  resumeController.getById(req, res, next)
);

// Regenerate (new version)
router.post('/:id/regenerate', (req, res, next) =>
  resumeController.regenerate(req, res, next)
);

// Download as PDF
router.get('/:id/download/:template', (req, res, next) =>
  resumeController.download(req, res, next)
);

// Delete resume
router.delete('/:id', (req, res, next) =>
  resumeController.delete(req, res, next)
);

export default router;
