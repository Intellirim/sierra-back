export type AssetKind = 'crypto'|'equity'|'realestate'|'fixed'|'cash'|'other';
export type RiskLevel = 'low'|'mid'|'high';
export type Horizon = 'short'|'mid'|'long';
export type Goal = 'preserve'|'income'|'growth'|'speculative';

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

export interface BuildReportInput {
  intake: IntakeSummary;
  toEmail?: string;
}
