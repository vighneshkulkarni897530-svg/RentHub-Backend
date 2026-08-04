import { Response } from 'express';
import KycService from '../services/kyc.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class KycController {
  submitVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const verification = await KycService.submitVerification(req.user!.id, req.user!.role, req.body);
    res.status(201).json(ApiResponse.ok(verification, 'KYC documents submitted'));
  });

  getVerificationStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const verification = await KycService.getVerificationStatus(req.user!.id);
    res.status(200).json(ApiResponse.ok(verification));
  });

  listVerifications = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const verifications = await KycService.listVerifications();
    res.status(200).json(ApiResponse.ok(verifications));
  });

  reviewVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await KycService.reviewVerification(req.params.id, req.user!.id, req.body.status, req.body.note);
    res.status(200).json(ApiResponse.ok(updated, 'KYC verification reviewed'));
  });
}

export default new KycController();
