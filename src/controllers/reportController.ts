// src/controllers/reportController.ts
import type { Request, Response, NextFunction } from 'express';
import { buildReportWorkflow } from '../workflows/buildReport.js';

export async function postReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { intake, toEmail, dashboardUrl } = req.body ?? {};
    if (!intake) return res.status(400).json({ error: 'intake is required' });

    const result = await buildReportWorkflow({ intake, toEmail, dashboardUrl });

    return res.json({
      ok: true,
      sentEmail: Boolean(toEmail),
      pdfFilename: result.pdfFilename,
      pdfSize: result.pdfBuffer.length,  // 버퍼 길이만 메타로 노출
      emailId: result.emailId ?? null,
      // 선택: 디버깅/확인용 메타
      refined: result.refined,
      markdown: result.markdown,
    });
  } catch (err) {
    next(err);
  }
}