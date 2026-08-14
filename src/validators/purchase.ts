import { z } from 'zod';

// ============================================================
// Purchase Request Validators
// ============================================================

export const createPurchaseRequestSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id'),
  rentalId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid rental id').optional().nullable(),
  message: z.string().max(1000, 'Message must be under 1000 characters').optional(),
});

export const purchaseRequestIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid purchase request id'),
});

export const listPurchaseRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'accepted', 'rejected', 'expired', 'completed', 'cancelled']).optional(),
});

// ============================================================
// Purchase Validators
// ============================================================

export const createPurchaseSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id'),
  purchaseRequestId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid purchase request id').optional(),
  rentalId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid rental id').optional().nullable(),
  deliveryOption: z.enum(['pickup', 'delivery']).default('pickup'),
  deliveryAddress: z.string().max(500).optional(),
});

export const purchaseIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid purchase id'),
});

export const listPurchasesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['confirmed', 'pending', 'cancelled']).optional(),
});

export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;