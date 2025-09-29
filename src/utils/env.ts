// src/utils/env.ts
import dotenv from "dotenv";

dotenv.config();

/**
 * 환경 변수 안전하게 가져오기
 * @param key 환경 변수 키
 * @param fallback 기본값 (없으면 에러)
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`환경 변수 ${key} 가 설정되지 않았습니다.`);
  }
  return value;
}

/**
 * 자주 쓰는 환경변수 모음
 * → index.ts 같은 곳에서 간단히 import 가능
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: process.env.PORT ?? "8080",
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? "*",

  // 필요 시 추가
  // OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  // RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
};