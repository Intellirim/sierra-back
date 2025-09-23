# sierra-back

Express + TypeScript 백엔드.  
기능: Intake 정제(GPT) → Tavily 검색 → GPT 요약 → PDF 생성 → 이메일(Resend) 발송.

## Run
```bash
cp .env.example .env  # 키 입력
npm ci
npm run dev
