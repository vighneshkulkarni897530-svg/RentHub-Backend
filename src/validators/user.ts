import { z } from 'zod';
import { isValidIndianPhone } from '../utils/phone';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  phone: z.string().optional().refine((val) => !val || isValidIndianPhone(val), 'Please enter a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)'),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
  location: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      coordinates: z
        .object({
          lat: z.number().optional(),
          lng: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  storeName: z.string().max(100).optional(),
  storeDescription: z.string().max(500).optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(['customer', 'owner', 'admin']),
});

export const userIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user id'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

