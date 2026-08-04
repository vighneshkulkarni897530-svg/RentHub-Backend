import { Response } from 'express';
import OwnerService from '../services/owner.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class OwnerController {
  getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await OwnerService.getOwnerStats(req.user!.id);
    res.status(200).json(ApiResponse.ok(stats));
  });

  getListings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const listings = await OwnerService.getOwnerListings(req.user!.id);
    res.status(200).json(ApiResponse.ok(listings));
  });

  getBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const bookings = await OwnerService.getOwnerBookings(req.user!.id, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      status: req.query.status as string | undefined,
    });
    res.status(200).json(ApiResponse.ok(bookings));
  });

  getReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reviews = await OwnerService.getOwnerReviews(req.user!.id);
    res.status(200).json(ApiResponse.ok(reviews));
  });

  getEarnings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const earnings = await OwnerService.getOwnerEarnings(req.user!.id);
    res.status(200).json(ApiResponse.ok(earnings));
  });

  submitVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const verification = await OwnerService.submitVerification(req.user!.id, req.body);
    res.status(201).json(ApiResponse.ok(verification, 'Verification submitted'));
  });

  getVerificationStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const verification = await OwnerService.getVerificationStatus(req.user!.id);
    res.status(200).json(ApiResponse.ok(verification));
  });
}

export default new OwnerController();

