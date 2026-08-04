import { z } from 'zod';

export const wishlistProductParamsSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id'),
});

export const addToWishlistSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id'),
});

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;

