import { Router } from 'express';
import { jobController } from '../controllers';
import { requireAuth, validate } from '../middleware';
import { createJobSchema, updateJobStatusSchema } from '../validators';

const router = Router();

router.use(requireAuth);

// Dashboard stats
router.get('/stats', (req, res, next) =>
  jobController.getStats(req, res, next)
);

// List all jobs
router.get('/', (req, res, next) =>
  jobController.list(req, res, next)
);

// Create new job
router.post('/', validate(createJobSchema), (req, res, next) =>
  jobController.create(req, res, next)
);

// Get single job
router.get('/:id', (req, res, next) =>
  jobController.getById(req, res, next)
);

// Update job status
router.patch('/:id/status', validate(updateJobStatusSchema), (req, res, next) =>
  jobController.updateStatus(req, res, next)
);

// Update general job details (e.g. priority, notes, details)
router.patch('/:id', (req, res, next) =>
  jobController.update(req, res, next)
);

// Delete job
router.delete('/:id', (req, res, next) =>
  jobController.delete(req, res, next)
);

export default router;
