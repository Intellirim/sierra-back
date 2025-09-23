import type { Request, Response } from 'express';
import { buildReportWorkflow } from '../workflows/buildReport.js';

export async function postReport(req: Request, res: Response) {
  const { intake, toEmail } = req.body || {};
  if (!intake) return res.status(400).json({ error: 'intake is required' });

  const result = await buildReportWorkflow({ intake, toEmail });
  // PDF는 이메일 첨부로 보냈고, API 응답엔 메타만
  return res.json({
    ok: true,
    sentEmail: Boolean(toEmail),
    pdfFilename: result.pdf.filename,
    emailId: result.emailId ?? null
  });
}
