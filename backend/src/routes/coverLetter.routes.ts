import { Router } from 'express';
import { coverLetterController } from '../controllers';
import { requireAuth } from '../middleware';

const router = Router();

router.use(requireAuth);

// Generate cover letter (standalone or linked to resume/job)
router.post('/generate', (req, res, next) =>
  coverLetterController.generate(req, res, next)
);

// List all cover letters
router.get('/', (req, res, next) =>
  coverLetterController.list(req, res, next)
);

// Get single cover letter
router.get('/:id', (req, res, next) =>
  coverLetterController.getById(req, res, next)
);

// Update content (user edits)
router.patch('/:id', (req, res, next) =>
  coverLetterController.update(req, res, next)
);

// Download as PDF
router.get('/:id/download', (req, res, next) =>
  coverLetterController.download(req, res, next)
);

// Delete cover letter
router.delete('/:id', (req, res, next) =>
  coverLetterController.delete(req, res, next)
);

export default router;
