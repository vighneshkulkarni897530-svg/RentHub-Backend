import { z } from 'zod';

export const redeemPointsSchema = z.object({
  points: z.number().int().positive(),
});

export const applyReferralSchema = z.object({
  referralCode: z.string().min(3).max(20),
});

export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;
export type ApplyReferralInput = z.infer<typeof applyReferralSchema>;
