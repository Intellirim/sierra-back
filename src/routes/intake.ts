import { Router } from 'express';
import { postIntake } from '../controllers/intakeController.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, scope: 'intake' }));
router.post('/', postIntake);

export default router;
