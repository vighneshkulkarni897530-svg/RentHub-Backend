import { z } from 'zod';

export const createReportSchema = z.object({
  type: z.enum(['product', 'user', 'booking', 'review']),
  reportedItemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid reported item id'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  evidenceUrls: z.array(z.string().url()).optional().default([]),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(['open', 'investigating', 'resolved', 'dismissed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  adminResolution: z.string().max(1000).optional(),
});

export const reportIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid report id'),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

