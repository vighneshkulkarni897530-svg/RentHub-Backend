import { Response } from 'express';
import ReviewService from '../services/review.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class ReviewController {
  createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const review = await ReviewService.createReview(req.user!.id, req.params.id, req.body);
    res.status(201).json(ApiResponse.ok(review, 'Review submitted'));
  });

  getProductReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reviews = await ReviewService.getProductReviews(req.params.id, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 10,
    });
    res.status(200).json(ApiResponse.ok(reviews));
  });

  getMyReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reviews = await ReviewService.getMyReviews(req.user!.id);
    res.status(200).json(ApiResponse.ok(reviews));
  });

  respondToReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const review = await ReviewService.respondToReview(req.params.id, req.user!.id, req.body.response);
    res.status(200).json(ApiResponse.ok(review, 'Response submitted'));
  });
}

export default new ReviewController();

