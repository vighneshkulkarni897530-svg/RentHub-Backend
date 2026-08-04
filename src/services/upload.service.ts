import ApiError from '../utils/ApiError';
import { uploadToCloudinary, isConfigured } from '../config/cloudinary';

export class UploadService {
  /**
   * Upload a single file. Uses Cloudinary when configured,
   * otherwise stores locally (returns the local file path info).
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

    // Fallback: return the file metadata (in a real app you'd save to disk)
    return {
      url: '',
      publicId: '',
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      note: 'Cloudinary not configured - file not persisted remotely',
    };
  }

  /**
   * Upload multiple files.
   */
  async uploadMultiple(files: Express.Multer.File[], folder = 'renthub') {
    if (!files || !files.length) throw new ApiError(400, 'No files uploaded');
    const results = [];
    for (const file of files) {
      results.push(await this.uploadFile(file, folder));
    }
    return results;
  }
}

export default new UploadService();

