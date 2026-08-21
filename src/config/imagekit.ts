import ImageKit, { toFile } from '@imagekit/nodejs';
import env from './env';
import logger from './logger';

/**
 * ImageKit configuration for permanent product image storage.
 *
 * Private keys live ONLY on the backend. The frontend never receives
 * the private key or the upload API endpoint.
 */
const isConfigured = Boolean(
  env.imagekit.publicKey &&
  env.imagekit.privateKey &&
  env.imagekit.urlEndpoint
);

let imagekit: ImageKit | null = null;

if (isConfigured) {
  imagekit = new ImageKit({
    privateKey: env.imagekit.privateKey,
  });
  logger.info('ImageKit configured successfully.');
} else {
  logger.warn(
    'ImageKit not configured — image uploads will fail until IMAGEKIT_* keys are set in .env'
  );
}

/**
 * Upload a file buffer to ImageKit and return a permanent URL.
 * @param file The uploaded file (buffer + mimetype + originalname)
 * @param folder ImageKit folder name
 */
export async function uploadToImageKit(
  file: { buffer: Buffer; mimetype: string; originalname?: string },
  folder = 'renthub'
): Promise<{ url: string; fileId: string }> {
  if (!isConfigured || !imagekit) {
    throw new Error(
      'ImageKit is not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in .env'
    );
  }

  const safeName = (file.originalname || 'image')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .slice(0, 100);

  const uploadFile = await toFile(file.buffer, safeName, { type: file.mimetype });

  const result = await imagekit.files.upload({
    file: uploadFile,
    fileName: safeName,
    folder,
    useUniqueFileName: true,
  });

  return {
    url: result.url || '',
    fileId: result.fileId || '',
  };
}

export { imagekit, isConfigured };