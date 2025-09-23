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
