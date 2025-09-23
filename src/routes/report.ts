import { Router } from 'express';
import { postReport } from '../controllers/reportController.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, scope: 'report' }));
router.post('/', postReport);

export default router;
