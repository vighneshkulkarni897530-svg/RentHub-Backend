import { z } from 'zod';
import { isValidIndianPhone } from '../utils/phone';

export const createPartnerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().refine((val) => isValidIndianPhone(val), 'Please enter a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)'),
  email: z.string().email().optional(),
  vehicle: z.string().max(50).optional(),
  zones: z.array(z.string().max(50)).optional().default([]),
});

export const updatePartnerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional().refine((val) => !val || isValidIndianPhone(val), 'Please enter a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)'),
  email: z.string().email().optional(),
  vehicle: z.string().max(50).optional(),
  zones: z.array(z.string().max(50)).optional(),
  status: z.enum(['active', 'inactive', 'busy']).optional(),
  isVerified: z.boolean().optional(),
});

export const partnerIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid partner id'),
});

export const assignPartnerSchema = z.object({
  partnerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid partner id'),
});

export const bookingIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking id'),
});

export const schedulePickupSchema = z.object({
  pickupDate: z.string().or(z.date()),
  note: z.string().max(500).optional(),
});

export const updateDeliveryStatusSchema = z.object({
  deliveryStatus: z.enum([
    'pending',
    'pickup_ready',
    'out_for_delivery',
    'delivered',
    'return_pickup',
    'returned',
    'cancelled',
  ]),
  note: z.string().max(500).optional(),
  deliveryOtp: z.string().max(6).optional(),
  estimatedArrival: z.string().or(z.date()).optional(),
});

export const verifyOtpSchema = z.object({
  otp: z.string().min(4).max(6),
});

export const listPartnersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  zone: z.string().optional(),
  status: z.string().optional(),
});
