import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(2, 'Comment must be at least 2 characters').max(1000),
  booking: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking id').optional(),
});

export const reviewIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid review id'),
});

export const productIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id'),
});

export const respondReviewSchema = z.object({
  response: z.string().min(2).max(1000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

