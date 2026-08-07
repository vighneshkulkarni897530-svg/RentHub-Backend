import ApiError from '../utils/ApiError';
import { uploadToCloudinary, isConfigured } from '../config/cloudinary';

export class UploadService {
  /**
   * Upload a single file. Uses Cloudinary when configured.
   * If Cloudinary is not configured, the upload is rejected so callers
   * never end up with broken image URLs in production.
   */
  async uploadFile(file: Express.Multer.File, folder = 'renthub') {
    if (!file) throw new ApiError(400, 'No file uploaded');

    if (isConfigured) {
      try {
        const result = await uploadToCloudinary({ buffer: file.buffer, mimetype: file.mimetype }, folder);
        return {
          url: result.url,
          publicId: result.publicId,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        };
      } catch (error) {
        throw new ApiError(502, `Cloudinary upload failed: ${(error as Error).message}`);
      }
    }

    // Cloudinary not configured — reject instead of silently dropping the file.
    throw new ApiError(503, 'File storage is not configured. Please set CLOUDINARY_* environment variables.');
  }

  /**
   * Upload multiple files concurrently (parallel, bounded by Multer's limit).
   */
  async uploadMultiple(files: Express.Multer.File[], folder = 'renthub') {
    if (!files || !files.length) throw new ApiError(400, 'No files uploaded');
    const results = await Promise.all(files.map((file) => this.uploadFile(file, folder)));
    return results;
  }
}

export default new UploadService();
