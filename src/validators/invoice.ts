import { z } from 'zod';

export const invoiceIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid invoice id'),
});

export const createInvoiceSchema = z.object({
  paymentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment id'),
});

export const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
