// src/services/pdfService.ts
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import type { IntakeSummary } from "../types/index.js"; // ✅ .js 확장자 명시
import { logger } from "../utils/logger.js";           // ✅ .js 확장자 명시

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.resolve(__dirname, "..", "templates", "report.html");

type BuildOptions = {
  dashboardUrl?: string; // QR로 연결할 프론트 URL (예: https://sierra-web.vercel.app/dashboard)
};

type ChartDatum = { label: string; value: number };

function num(n?: string | number) {
  if (n === undefined || n === null || n === "") return 0;
  const v = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(v) ? Number(v) : 0;
}

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

function clamp(x: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, x));
}

function computeAllocation(summary: IntakeSummary) {
  const buckets: Record<string, number> = { crypto: 0, equity: 0, realestate: 0, fixed: 0, cash: 0, other: 0 };

  // 간이 평가액: qty * avgCost / price 없을 때는 입력값 기반 추정
  const cryptoVal = sum(
    (summary.crypto ?? []).map((r: any) => num(r.qty) * (num(r.avgCost) || 1)) // ✅ any 지정
  );
  const equityVal = sum(
    (summary.equity ?? []).map((r: any) => num(r.qty) * (num(r.avgCost) || 1)) // ✅ any 지정
  );
  const realVal = sum((summary.realestate ?? []).map((r: any) => num(r.price))); // ✅ any 지정
  const fixedVal = sum((summary.fixed ?? []).map((r: any) => num(r.coupon) + num(r.duration))); // ✅ any 지정
  const cashVal = num(summary.cash?.amount);

  buckets.crypto = cryptoVal;
  buckets.equity = equityVal;
  buckets.realestate = realVal;
  buckets.fixed = fixedVal;
  buckets.cash = cashVal;

  const total = Math.max(1, sum(Object.values(buckets)));
  const dist = Object.entries(buckets).map<ChartDatum>(([label, value]) => ({
    label,
    value: Number(((value / total) * 100).toFixed(2)),
  }));

  return { dist, totalValueApprox: total };
}

function topHoldings(summary: IntakeSummary) {
  type Row = { name: string; value: number; meta?: string };
  const rows: Row[] = [];

  (summary.crypto ?? []).forEach((r: any) =>   // ✅ any 지정
    rows.push({
      name: r.symbol || "Crypto",
      value: num(r.qty) * (num(r.avgCost) || 1),
      meta: r.chain || r.venue,
    })
  );
  (summary.equity ?? []).forEach((r: any) =>   // ✅ any 지정
    rows.push({
      name: r.ticker || "Equity",
      value: num(r.qty) * (num(r.avgCost) || 1),
      meta: r.market || r.sector,
    })
  );

  rows.sort((a, b) => b.value - a.value);
  const top5 = rows.slice(0, 5);
  return top5.map<ChartDatum>((r) => ({ label: r.name, value: Number(r.value.toFixed(2)) }));
}

function riskAndFit(summary: IntakeSummary) {
  // 0~100 스코어(간이): 변동성 선호, 손실한도, 자산구성 가중치
  const vol = clamp(num(summary.profile?.volPref));
  const loss = clamp(num(summary.profile?.lossLimit));
  const riskPref = summary.profile?.risk ?? "mid";
  const horizon = summary.profile?.horizon ?? "mid";
  const goal = summary.profile?.goal ?? "growth";

  const base =
    (riskPref === "high" ? 80 : riskPref === "mid" ? 50 : 25) +
    (horizon === "long" ? 10 : horizon === "short" ? -10 : 0);

  const riskScore = clamp(Math.round(0.5 * vol + 0.5 * (100 - loss) + base / 2));

  // 목표 적합도: goal과 현재 분산 정도로 간단 산정
  const alloc = computeAllocation(summary).dist;
  const growthTilt =
    (alloc.find((d) => d.label === "equity")?.value ?? 0) +
    (alloc.find((d) => d.label === "crypto")?.value ?? 0);
  const preserveTilt =
    (alloc.find((d) => d.label === "fixed")?.value ?? 0) +
    (alloc.find((d) => d.label === "cash")?.value ?? 0);

  let fit = 50;
  if (goal === "growth") fit = clamp(40 + growthTilt * 0.6);
  if (goal === "preserve") fit = clamp(40 + preserveTilt * 0.6);
  if (goal === "income")
    fit = clamp(
      35 +
        (preserveTilt + (alloc.find((d) => d.label === "realestate")?.value ?? 0)) * 0.5
    );
  if (goal === "speculative")
    fit = clamp(
      30 +
        (growthTilt + (alloc.find((d) => d.label === "crypto")?.value ?? 0)) * 0.7
    );

  return { riskScore, fitScore: Math.round(fit) };
}

function stressTest(summary: IntakeSummary) {
  const rows: { label: string; base: number }[] = [];
  (summary.crypto ?? []).forEach((r: any) => // ✅ any 지정
    rows.push({ label: r.symbol || "Crypto", base: num(r.qty) * (num(r.avgCost) || 1) })
  );
  (summary.equity ?? []).forEach((r: any) => // ✅ any 지정
    rows.push({ label: r.ticker || "Equity", base: num(r.qty) * (num(r.avgCost) || 1) })
  );

  const totals = {
    base: sum(rows.map((r) => r.base)),
    d5: sum(rows.map((r) => r.base * 0.95)),
    d10: sum(rows.map((r) => r.base * 0.9)),
    d20: sum(rows.map((r) => r.base * 0.8)),
  };

  return {
    totals,
    table: [
      { scenario: "-5%", value: totals.d5, loss: totals.base - totals.d5 },
      { scenario: "-10%", value: totals.d10, loss: totals.base - totals.d10 },
      { scenario: "-20%", value: totals.d20, loss: totals.base - totals.d20 },
    ],
  };
}

export async function generateReportPDF(
  summary: IntakeSummary,
  options: BuildOptions = {}
) {
  // 데이터 가공
  const allocation = computeAllocation(summary);
  const top5 = topHoldings(summary);
  const gauges = riskAndFit(summary);
  const stress = stressTest(summary);

  // 인사이트 3줄(간단 규칙)
  const insights: string[] = [];
  if (gauges.riskScore >= 70) insights.push("변동성 허용도가 높은 편입니다.");
  else if (gauges.riskScore <= 35) insights.push("보수적 성향으로 추정됩니다.");
  const cashPct = allocation.dist.find((d) => d.label === "cash")?.value ?? 0;
  if (cashPct < 10) insights.push("현금 비중이 낮아 유동성 리스크가 있습니다.");
  const loss = num(summary.profile?.lossLimit);
  if (loss <= 20) insights.push(`손실허용 한도(${loss}%)에 민감합니다.`);

  // QR
  const qrDataUrl = await QRCode.toDataURL(
    options.dashboardUrl || "https://example.com/dashboard"
  );

  // 템플릿 로드
  const html = await fs.readFile(TEMPLATE_PATH, "utf8");

  // 템플릿에 주입할 데이터 페이로드
  const payload = {
    createdAt: new Date().toISOString(),
    profile: summary.profile,
    allocation: allocation.dist,
    totalValueApprox: allocation.totalValueApprox,
    top5,
    gauges,
    stress,
    insights,
    glossary: [
      { term: "변동성", def: "자산 수익률의 변동 폭. 높을수록 가격 흔들림이 큼." },
      { term: "듀레이션", def: "금리변화에 대한 채권 가격 민감도." },
      { term: "리밸런싱", def: "목표 비중에 맞춰 자산을 재조정하는 행위." },
    ],
    cta: {
      title: "대시보드에서 가정 바꿔보기",
      url: options.dashboardUrl || "https://example.com/dashboard",
    },
    qr: qrDataUrl,
  };

  const pageHtml = html.replace(
    "/*__REPORT_PAYLOAD__*/",
    `window.__REPORT__ = ${JSON.stringify(payload)};`
  );

  // 렌더링
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(pageHtml, { waitUntil: "load" });

    // 차트/scripts 완료 신호 대기
    await page.waitForFunction("window.__chartsReady === true", {
      timeout: 15000,
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", right: "12mm", bottom: "16mm", left: "12mm" },
    });
    return pdf; // Buffer
  } finally {
    await browser.close();
  }
}