import { z } from 'zod';

export const createDamageReportSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking id'),
  stage: z.enum(['pre_rental', 'during_rental', 'post_return']),
  photos: z.array(z.string().url()).optional().default([]),
  videos: z.array(z.string().url()).optional().default([]),
  comments: z.string().max(2000).optional().default(''),
  chargeEstimate: z.number().nonnegative().optional().default(0),
  refundAmount: z.number().nonnegative().optional().default(0),
});

export const updateDamageReportSchema = z.object({
  status: z.enum(['open', 'under_review', 'resolved', 'closed']),
  adminNote: z.string().max(1000).optional(),
  chargeEstimate: z.number().nonnegative().optional(),
  refundAmount: z.number().nonnegative().optional(),
});

export const damageReportIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid report id'),
});
