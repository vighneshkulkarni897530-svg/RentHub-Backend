import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../utils/ApiError';

// Ensure uploads directory exists for local storage fallback
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

// Use memory storage so files can be uploaded to Cloudinary directly
const memoryStorage = multer.memoryStorage();

// SVG is intentionally excluded because it can contain executable scripts (XSS risk).
const ALLOWED_TYPES = /jpeg|jpg|png|gif|webp|pdf/;

// Strict MIME allow-list (defense in depth — never trust the extension alone).
const ALLOWED_MIMES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = /jpeg|jpg|png|gif|webp|pdf/.test(ext);
  const mimeEntry = ALLOWED_MIMES[file.mimetype];
  const allowedMime = Boolean(mimeEntry && mimeEntry.includes(ext));
  if (allowedExt && allowedMime) return cb(null, true);
  cb(new ApiError(400, "Only JPEG, PNG, GIF, WebP and PDF files are allowed"));
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 MB

export const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits,
});

export const uploadLocal = multer({
  storage,
  fileFilter,
  limits,
});

export default upload;

