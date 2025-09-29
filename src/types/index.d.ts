// src/types/index.d.ts

export type AssetKind = 'crypto' | 'equity' | 'realestate' | 'fixed' | 'cash' | 'other';
export type RiskLevel = 'low' | 'mid' | 'high';
export type Horizon   = 'short' | 'mid' | 'long';
export type Goal      = 'preserve' | 'income' | 'growth' | 'speculative';

export interface IntakeSummary {
  assets: AssetKind[];
  profile: {
    risk: RiskLevel;
    horizon: Horizon;
    goal: Goal;
    lossLimit: number;
    volPref: number;
  };
  crypto: { symbol: string; chain?: string; venue?: string; qty?: string; avgCost?: string; staking?: boolean }[];
  equity: { ticker: string; market?: string; qty?: string; avgCost?: string; sector?: string }[];
  realestate: { type?: string; location?: string; purchasedAt?: string; price?: string; loan?: string; rate?: string; rent?: string }[];
  fixed: { kind?: string; name?: string; coupon?: string; maturity?: string; rating?: string; duration?: string }[];
  cash: { amount?: string; ccy?: string; rate?: string; needAt?: string };
}

/** 프론트에서 전달하는 워크플로 입력 */
export interface BuildReportInput {
  intake: IntakeSummary;
  toEmail?: string;
  /** PDF 내 QR/CTA가 연결될 대시보드 URL */
  dashboardUrl?: string;
}

/** 워크플로 결과(컨트롤러/라우트에서 사용) */
export interface BuildReportResult {
  refined: IntakeSummary;
  findings: any;       // Tavily 응답 타입을 별도로 정의했다면 교체 가능
  markdown: string;
  pdfBuffer: Buffer;   // 생성된 PDF 버퍼
  pdfFilename: string; // 예: 'report.pdf'
  emailId?: string;    // Resend 전송 ID(선택)
}