import type { Request, Response } from 'express';
import { intakeSchema } from '../schemas/intakeSchema.js';
import { refineIntake } from '../services/gptService.js';

export async function postIntake(req: Request, res: Response) {
  const parsed = intakeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid intake payload', details: parsed.error.flatten() });
  }
  const refined = await refineIntake(parsed.data);
  return res.json({ ok: true, refined });
}
