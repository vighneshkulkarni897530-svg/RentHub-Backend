import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(20),
  description: z.string().max(1000).optional(),
  couponType: z.enum(['fixed', 'percentage']).default('fixed'),
  value: z.number().nonnegative(),
  minOrderAmount: z.number().nonnegative().default(0),
  maxDiscount: z.number().nonnegative().default(0),
  validFrom: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
  usageLimit: z.number().int().min(0).default(0),
  ownerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid owner id').optional(),
  categoryIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category id')).optional().default([]),
  productIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id')).optional().default([]),
  isActive: z.boolean().default(true),
});

export const applyCouponSchema = z.object({
  couponCode: z.string().trim().min(3).max(20),
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id').optional(),
  totalPrice: z.number().nonnegative(),
});

export const couponIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid coupon id'),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
