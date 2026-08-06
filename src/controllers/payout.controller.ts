import { Response } from 'express';
import PayoutService from '../services/payout.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class PayoutController {
  getSettlementSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const summary = await PayoutService.getSettlementSummary(req.user!.id);
    res.status(200).json(ApiResponse.ok(summary));
  });

  createPayout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payout = await PayoutService.createPayout(req.user!.id, {
      amount: req.body.amount,
      method: req.body.method,
      accountDetails: req.body.accountDetails,
    });
    res.status(201).json(ApiResponse.ok(payout, 'Payout requested'));
  });

  getPayouts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payouts = await PayoutService.listPayouts(req.user!.id, req.user!.role, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      status: req.query.status as string | undefined,
    });
    res.status(200).json(ApiResponse.ok(payouts));
  });

  getPayout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payout = await PayoutService.getPayout(req.params.id);
    res.status(200).json(ApiResponse.ok(payout));
  });
}

export default new PayoutController();
