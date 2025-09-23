import { z } from 'zod';

export const intakeSchema = z.object({
  assets: z.array(z.enum(['crypto','equity','realestate','fixed','cash','other'])).min(1),
  profile: z.object({
    risk: z.enum(['low','mid','high']),
    horizon: z.enum(['short','mid','long']),
    goal: z.enum(['preserve','income','growth','speculative']),
    lossLimit: z.number().nonnegative(),
    volPref: z.number().nonnegative()
  }),
  crypto: z.array(z.object({
    symbol: z.string().min(0),
    chain: z.string().optional(),
    venue: z.string().optional(),
    qty: z.string().optional(),
    avgCost: z.string().optional(),
    staking: z.boolean().optional()
  })),
  equity: z.array(z.object({
    ticker: z.string().min(0),
    market: z.string().optional(),
    qty: z.string().optional(),
    avgCost: z.string().optional(),
    sector: z.string().optional()
  })),
  realestate: z.array(z.object({
    type: z.string().optional(),
    location: z.string().optional(),
    purchasedAt: z.string().optional(),
    price: z.string().optional(),
    loan: z.string().optional(),
    rate: z.string().optional(),
    rent: z.string().optional()
  })),
  fixed: z.array(z.object({
    kind: z.string().optional(),
    name: z.string().optional(),
    coupon: z.string().optional(),
    maturity: z.string().optional(),
    rating: z.string().optional(),
    duration: z.string().optional()
  })),
  cash: z.object({
    amount: z.string().optional(),
    ccy: z.string().optional(),
    rate: z.string().optional(),
    needAt: z.string().optional()
  })
});

export type IntakeSchema = z.infer<typeof intakeSchema>;
