import { Response } from 'express';
import RefundService from '../services/refund.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class RefundController {
  initiateRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
    const refund = await RefundService.initiateRefund({
      paymentId: req.body.paymentId,
      amount: req.body.amount,
      reason: req.body.reason,
      method: req.body.method,
      initiatedBy: req.user!.id,
    });
    res.status(201).json(ApiResponse.ok(refund, 'Refund initiated'));
  });

  getRefunds = asyncHandler(async (req: AuthRequest, res: Response) => {
    const refunds = await RefundService.listRefunds(req.user!.id, req.user!.role, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      status: req.query.status as string | undefined,
    });
    res.status(200).json(ApiResponse.ok(refunds));
  });

  getRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
    const refund = await RefundService.getRefund(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json(ApiResponse.ok(refund));
  });
}

export default new RefundController();
