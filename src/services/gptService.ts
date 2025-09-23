import OpenAI from 'openai';
import { requireEnv } from '../utils/env.js';

const client = new OpenAI({ apiKey: requireEnv('OPENAI_API_KEY') });

export async function refineIntake(intake: unknown) {
  const sys = `You are a financial analyst assistant. Normalize and sanity-check user intake JSON.
Return compact JSON with missing fields removed, numbers parsed to numeric when obvious (e.g., "15" -> 15). Keep tickers/symbols uppercased.`;
  const msg = [
    { role: 'system', content: sys },
    { role: 'user', content: 'Raw intake JSON:\n' + JSON.stringify(intake) }
  ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: msg,
    response_format: { type: 'json_object' },
    temperature: 0.2
  });

  const text = res.choices[0]?.message?.content || '{}';
  return JSON.parse(text);
}

export async function summarizeSearch(findings: any, intake: any) {
  const sys = `You combine finance web findings and user profile to produce a Korean investment brief. Output Markdown sections only.`;
  const user = `User profile JSON:\n${JSON.stringify(intake)}\n\nWeb findings JSON:\n${JSON.stringify(findings)}\n\nMake: Summary, Key Metrics, Risks, Suggested Actions.`;
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ],
    temperature: 0.3
  });
  return res.choices[0]?.message?.content ?? '';
}
