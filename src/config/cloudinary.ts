import { v2 as cloudinary } from 'cloudinary';
import env from './env';
import logger from './logger';

/**
 * Configures Cloudinary. If keys are missing (placeholder / empty),
 * uploads will gracefully fail with a clear message instead of crashing
 * the server at startup.
 */
const isConfigured = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
  logger.info('Cloudinary configured successfully.');
} else {
  logger.warn('Cloudinary not configured — image uploads will be disabled until keys are set in .env');
}

/**
 * Upload a file buffer/stream to Cloudinary.
 * @param file The uploaded file (buffer + mimetype)
 * @param folder Cloudinary folder name
 */
export async function uploadToCloudinary(
  file: { buffer: Buffer; mimetype: string },
  folder = 'renthub'
): Promise<{ url: string; publicId: string }> {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_* env variables.');
  }
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, { folder, resource_type: 'auto' });
  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Delete an asset from Cloudinary by public id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!isConfigured) return;
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary, isConfigured };

