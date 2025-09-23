// src/services/emailService.ts
import { Resend } from "resend";
import { logger } from "../utils/logger.js";
import { getEnv } from "../utils/env.js";

type SendReportArgs = {
  email: string;
  subject?: string;
  html: string;
  pdfBuffer?: Buffer; // Puppeteer 생성 버퍼
};

const resend = new Resend(getEnv("RESEND_API_KEY"));

export async function sendReportEmail({
  email,
  subject = "Sierra 리포트",
  html,
  pdfBuffer,
}: SendReportArgs) {
  const from = getEnv("EMAIL_FROM", "noreply@sierra.ai");

  const response = await resend.emails.send({
    from,
    to: email,
    subject,
    html,
    attachments: pdfBuffer
      ? [
          {
            filename: "report.pdf",
            content: pdfBuffer, // Buffer 그대로 전달
          },
        ]
      : undefined,
  });

  if (response.error) {
    logger.error(
      { err: response.error },
      `이메일 전송 실패: ${response.error.message ?? "unknown error"}`
    );
    throw new Error(
      `Resend send failed: ${response.error.message ?? JSON.stringify(response.error)}`
    );
  }

  // 성공 시 data.id 로 접근해야 함
  logger.info(`이메일 전송 완료: ${response.data!.id}`);
  return response.data; // { id: string }
}
