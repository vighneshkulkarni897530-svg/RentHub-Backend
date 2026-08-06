import { z } from 'zod';

export const createPayoutSchema = z.object({
  amount: z.number().positive().optional(),
  method: z.enum(['bank', 'upi', 'wallet']).default('bank'),
  accountDetails: z.any().optional(),
});

export const payoutIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payout id'),
});

export const listPayoutsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
});

export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
