import { z } from 'zod';

export const createRefundSchema = z.object({
  paymentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment id'),
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
  method: z.enum(['original', 'wallet']).optional(),
});

export const refundIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid refund id'),
});

export const listRefundsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
