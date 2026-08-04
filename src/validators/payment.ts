import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking id'),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order id is required'),
  razorpay_payment_id: z.string().min(1, 'Payment id is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
});

export const paymentIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment id'),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

