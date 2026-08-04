import { z } from 'zod';

export const submitKycSchema = z.object({
  documentType: z.enum(['aadhaar', 'pan', 'passport', 'driving_license']),
  documentUrls: z.array(z.string().url('Each document must be a valid URL')).min(1, 'Upload at least one document'),
  expiryDate: z.string().optional(),
  ocrData: z.record(z.any()).optional(),
});

export const kycIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid verification id'),
});

export const reviewKycSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  note: z.string().max(1000).optional(),
});

export type SubmitKycInput = z.infer<typeof submitKycSchema>;
