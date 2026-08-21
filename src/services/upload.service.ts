import fs from 'fs';
import path from 'path';
import ApiError from '../utils/ApiError';
import { uploadToImageKit, isConfigured as isImageKitConfigured } from '../config/imagekit';

// Local uploads directory (used when ImageKit is not configured).
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function safeExt(filename: string): string {
  const ext = path.extname(filename || '').toLowerCase();
  // Only allow safe image/pdf extensions (matches the multer fileFilter).
  return /\.(jpe?g|png|gif|webp|pdf)$/.test(ext) ? ext : '.jpg';
}

/**
 * Persist an in-memory file buffer to the local uploads directory.
 * Returns a URL that is served statically by the Express server.
 */
function saveLocal(file: Express.Multer.File): { url: string; filename: string } {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${unique}${safeExt(file.originalname)}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, file.buffer);
  return { url: `/uploads/${filename}`, filename };
}

export class UploadService {
  /**
   * Upload a single file. Uses ImageKit when configured.
   * Falls back to local disk storage so the app remains fully usable
   * without any paid/external upload service.
   */
  async uploadFile(file: Express.Multer.File, folder = 'renthub') {
    if (!file) throw new ApiError(400, 'No file uploaded');

    if (isImageKitConfigured) {
      try {
        const result = await uploadToImageKit(
          { buffer: file.buffer, mimetype: file.mimetype, originalname: file.originalname },
          folder
        );
        return {
          url: result.url,
          fileId: result.fileId,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        };
      } catch (error) {
        throw new ApiError(502, `ImageKit upload failed: ${(error as Error).message}`);
      }
    }

    // ImageKit not configured — save locally so uploads still work.
    const local = saveLocal(file);
    return {
      url: local.url,
      fileId: '',
      filename: local.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
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