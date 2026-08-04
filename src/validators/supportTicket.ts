import { z } from 'zod';

export const createSupportTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  message: z.string().min(5, 'Message must be at least 5 characters').max(2000),
  category: z.string().max(100).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium').optional(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user id').optional(),
});

export const addTicketMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});

export const ticketIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ticket id'),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;

