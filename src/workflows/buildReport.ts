import type { BuildReportInput, IntakeSummary } from '../types/index.d.js';
import { refineIntake, summarizeSearch } from '../services/gptService.js';
import { searchWithTavily } from '../services/tavilyService.js';
import { renderMarkdownToPdf } from '../services/pdfService.js';
import { sendReportEmail } from '../services/emailService.js';

export async function buildReportWorkflow(input: BuildReportInput) {
  // 1) 정제
  const refined: IntakeSummary = await refineIntake(input.intake);

  // 2) 질의 생성 (단순 예시: 선택한 자산 기반 키워드)
  const query = buildQueryFrom(refined);

  // 3) Tavily 검색
  const findings = await searchWithTavily(query);

  // 4) GPT 요약 → Markdown
  const md = await summarizeSearch(findings, refined);

  // 5) PDF 생성
  const pdf = await renderMarkdownToPdf('Sierra 투자 리포트', md);

  // 6) (선택) 이메일 발송
  let emailId: string | undefined;
  if (input.toEmail) {
    const result = await sendReportEmail({
      to: input.toEmail,
      subject: 'Sierra 투자 리포트',
      html: `<p>요청하신 리포트를 첨부합니다.</p><p>감사합니다.</p>`,
      attachments: [{ filename: pdf.filename, content: pdf.buffer }]
    });
    // @ts-expect-error resend 타입 단순화
    emailId = result?.id || result?.data?.id;
  }

  return { refined, findings, markdown: md, pdf, emailId };
}

function buildQueryFrom(intake: IntakeSummary) {
  const parts: string[] = [];

  if (intake.crypto?.length) {
    const syms = intake.crypto.filter(c => c.symbol).map(c => c.symbol.toUpperCase()).slice(0, 6);
    if (syms.length) parts.push(`crypto: ${syms.join(', ')} onchain & market outlook`);
  }

  if (intake.equity?.length) {
    const tks = intake.equity.filter(e => e.ticker).map(e => e.ticker.toUpperCase()).slice(0, 6);
    if (tks.length) parts.push(`equities: ${tks.join(', ')} earnings, valuation, catalysts`);
  }

  if (intake.fixed?.length) parts.push(`rates and credit outlook duration ${intake.fixed[0]?.duration || ''}`);
  if (intake.realestate?.length) parts.push(`Korea real estate price trend mortgage rate`);

  parts.push(`risk ${intake.profile.risk}, horizon ${intake.profile.horizon}, goal ${intake.profile.goal}`);
  return parts.join(' ; ');
}
