import { z } from 'zod';

const locationSchema = z.object({
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

export const createProductSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category id'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'used']).default('good'),
  location: locationSchema.optional(),
  pickupLocation: pickupLocationSchema.optional(),
  rentalPrice: z.number().positive('Rental price must be positive'),
  priceUnit: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  securityDeposit: z.number().nonnegative().default(0),
  features: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  deliveryOptions: z.array(z.enum(['pickup', 'delivery', 'both'])).optional(),
  cancellationPolicy: z.string().optional(),
  saleEnabled: z.boolean().default(false),
  salePrice: z.number().positive('Sale price must be positive').nullable().optional(),
  purchaseCondition: z.string().max(500).nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id'),
});

export const productSlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'used']).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'trending']).optional(),
  owner: z.string().optional(),
});

export const availabilityBlockSchema = z.object({
  reason: z.enum(['maintenance', 'blocked', 'unavailable']).default('blocked'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  note: z.string().max(500).optional(),
});

export const availabilityQuerySchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id').optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

