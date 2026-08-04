import { Response } from 'express';
import UploadService from '../services/upload.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class UploadController {
  uploadSingle = asyncHandler(async (req: AuthRequest, res: Response) => {
    const file = (req as any).file as Express.Multer.File;
    const result = await UploadService.uploadFile(file, req.body.folder || 'renthub');
    res.status(201).json(ApiResponse.ok(result, 'File uploaded'));
  });

  uploadMultiple = asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = (req as any).files as Express.Multer.File[] | undefined;
    const result = await UploadService.uploadMultiple(files || [], req.body.folder || 'renthub');
    res.status(201).json(ApiResponse.ok(result, 'Files uploaded'));
  });
}

export default new UploadController();

