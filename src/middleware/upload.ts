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

const ALLOWED_TYPES = /jpeg|jpg|png|gif|webp|svg|pdf/;

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extname = ALLOWED_TYPES.test(path.extname(file.originalname).toLowerCase());
  const mimetype = ALLOWED_TYPES.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb(new ApiError(400, 'Only image and PDF files are allowed'));
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

