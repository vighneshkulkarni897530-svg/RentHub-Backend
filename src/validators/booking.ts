import { z } from 'zod';

const deliveryAddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  mobile: z.string().min(10, 'Mobile number is required').max(15),
  address: z.string().min(1, 'Address is required').max(500),
  area: z.string().min(1, 'Area is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  landmark: z.string().max(200).optional(),
  instructions: z.string().max(500).optional(),
});

const pickupLocationSchema = z.object({
  address: z.string().min(1, 'Pickup address is required').max(500),
  area: z.string().min(1, 'Area is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  landmark: z.string().max(200).optional(),
  instructions: z.string().max(500).optional(),
  contactNumber: z.string().max(15).optional(),
});

export const createBookingSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  duration: z.number().int().positive(),
  durationUnit: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  totalPrice: z.number().nonnegative(),
  securityDeposit: z.number().nonnegative().optional(),
  deliveryOption: z.enum(['pickup', 'delivery']).default('pickup'),
  fulfillmentMethod: z.enum(['delivery', 'pickup']).default('pickup'),
  deliveryAddress: deliveryAddressSchema.optional(),
  pickupLocation: pickupLocationSchema.optional(),
  deliveryAddressString: z.string().max(500).optional(),
  deliveryFee: z.number().nonnegative().default(0).optional(),
  notes: z.string().max(500).optional(),
  couponCode: z.string().trim().min(3).max(20).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'active', 'completed', 'cancelled', 'declined']),
  reason: z.string().max(500).optional(),
});

export const bookingIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking id'),
});

export const updateBookingDeliverySchema = z.object({
  deliveryStatus: z.enum(['pending', 'pickup_ready', 'out_for_delivery', 'delivered', 'return_pickup', 'returned', 'cancelled']),
  deliveryPartner: z.string().max(200).optional(),
  estimatedArrival: z.string().or(z.date()).optional(),
  deliveryOtp: z.string().max(10).optional(),
  note: z.string().max(500).optional(),
});

export const verifyDeliveryOtpSchema = z.object({
  deliveryOtp: z.string().max(10),
});

export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'confirmed', 'active', 'completed', 'cancelled', 'declined']).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;