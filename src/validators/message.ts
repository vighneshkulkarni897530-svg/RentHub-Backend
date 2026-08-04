import { z } from 'zod';

export const sendMessageSchema = z.object({
  receiver: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid receiver id'),
  content: z.string().min(1, 'Message cannot be empty').max(2000),
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id').optional(),
  conversationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid conversation id').optional(),
});

export const conversationIdParamsSchema = z.object({
  conversationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid conversation id'),
});

export const messageIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message id'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

