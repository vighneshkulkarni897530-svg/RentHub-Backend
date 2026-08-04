import { Router } from 'express';
import ReviewController from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReviewSchema, productIdParamsSchema, reviewIdParamsSchema, respondReviewSchema } from '../validators/review';

const router = Router();

// Public
router.get(
  '/product/:id',
  validate({ params: productIdParamsSchema }),
  ReviewController.getProductReviews
);

// Protected
router.post(
  '/product/:id',
  authenticate,
  validate({ params: productIdParamsSchema, body: createReviewSchema }),
  ReviewController.createReview
);
router.get('/my', authenticate, ReviewController.getMyReviews);
router.put(
  '/:id/respond',
  authenticate,
  authorize('owner', 'admin'),
  validate({ params: reviewIdParamsSchema, body: respondReviewSchema }),
  ReviewController.respondToReview
);

export default router;

