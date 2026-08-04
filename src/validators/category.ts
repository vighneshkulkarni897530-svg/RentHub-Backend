import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(50),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  subcategories: z.array(z.string()).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  status: z.enum(['active', 'inactive']).optional(),
  subcategories: z.array(z.string()).optional(),
});

export const categorySlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const categoryIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category id'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

