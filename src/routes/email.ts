import { Router } from 'express';
import { sendReportEmail } from '../services/emailService.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, scope: 'email' }));

router.post('/send', async (req, res, next) => {
  try {
    const { to, subject, html } = req.body || {};
    if (!to || !subject || !html) return res.status(400).json({ error: 'to, subject, html required' });
    const data = await sendReportEmail({ to, subject, html });
    res.json({ ok: true, data });
  } catch (e) { next(e); }
});

export default router;
