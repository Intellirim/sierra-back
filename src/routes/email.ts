// src/routes/email.ts
import { Router, Request, Response, NextFunction } from "express";
import { sendReportEmail } from "../services/emailService.js";

const router = Router();

router.get("/health", (_req: Request, res: Response) =>
  res.json({ ok: true, scope: "email" })
);

router.post("/send", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, subject, html } = req.body || {};
    if (!email || !html) {
      return res.status(400).json({ error: "email, html is required (subject optional)" });
    }
    const data = await sendReportEmail({ email, subject, html });
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
});

export default router;