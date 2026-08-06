import { Response } from 'express';
import LoyaltyService from '../services/loyalty.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class LoyaltyController {
  getAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const account = await LoyaltyService.getAccount(req.user!.id);
    res.status(200).json(ApiResponse.ok(account));
  });

  redeemPoints = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await LoyaltyService.redeemPoints(req.user!.id, req.body.points);
    res.status(200).json(ApiResponse.ok(result, 'Points redeemed'));
  });

  getOrCreateReferral = asyncHandler(async (req: AuthRequest, res: Response) => {
    const referral = await LoyaltyService.getOrCreateReferral(req.user!.id);
    res.status(200).json(ApiResponse.ok(referral));
  });

  applyReferral = asyncHandler(async (req: AuthRequest, res: Response) => {
    await LoyaltyService.applyReferral(req.body.referralCode, req.user!.id);
    res.status(200).json(ApiResponse.ok(null, 'Referral applied'));
  });

  getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const transactions = await LoyaltyService.listTransactions(req.user!.id);
    res.status(200).json(ApiResponse.ok(transactions));
  });
}

export default new LoyaltyController();
