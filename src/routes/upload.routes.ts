import { Router } from 'express';
import UploadController from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/single', upload.single('file'), UploadController.uploadSingle);
router.post('/multiple', upload.array('files', 10), UploadController.uploadMultiple);

export default router;

