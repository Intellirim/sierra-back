// src/services/gptService.ts
import OpenAI from "openai";
import { getEnv } from "../utils/env.js";

const client = new OpenAI({ apiKey: getEnv("OPENAI_API_KEY") });

/**
 * 인테이크 JSON을 정규화/검증
 * - 숫자 문자열은 숫자로 파싱
 * - 심볼/티커는 대문자 유지
 * - 누락/불명확 필드는 제거
 */
export async function refineIntake(intake: unknown) {
  const system = `You are a financial analyst assistant. Normalize and sanity-check user intake JSON.
Return compact JSON with missing fields removed, numbers parsed to numeric when obvious (e.g., "15" -> 15). Keep tickers/symbols uppercased.`;

  const messages: Array<{ role: "system" | "user"; content: string }> = [
    { role: "system", content: system },
    { role: "user", content: "Raw intake JSON:\n" + JSON.stringify(intake) },
  ];

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const text = res.choices[0]?.message?.content || "{}";
  try {
    return JSON.parse(text);
  } catch {
    // 혹시 모델이 JSON을 살짝 벗어나면 안전하게 빈 객체 반환
    return {};
  }
}

/**
 * 웹 검색 결과 + 사용자 프로필을 한국어 요약(마크다운)으로 생성
 * - Summary, Key Metrics, Risks, Suggested Actions 섹션
 */
export async function summarizeSearch(findings: unknown, intake: unknown) {
  const system = `You combine finance web findings and user profile to produce a Korean investment brief. Output Markdown sections only.`;
  const user = `User profile JSON:\n${JSON.stringify(intake)}\n\nWeb findings JSON:\n${JSON.stringify(findings)}\n\nMake: Summary, Key Metrics, Risks, Suggested Actions.`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
  });

  return res.choices[0]?.message?.content ?? "";
}