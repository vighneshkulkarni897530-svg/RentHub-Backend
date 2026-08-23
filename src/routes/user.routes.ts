import { Router } from 'express';
import UserController from '../controllers/user.controller';
import KycController from '../controllers/kyc.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema, userIdParamsSchema } from '../validators/user';
import { submitKycSchema } from '../validators/kyc';
import { wishlistProductParamsSchema } from '../validators/wishlist';

const router = Router();

router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.put('/profile', validate({ body: updateProfileSchema }), UserController.updateProfile);
router.get('/dashboard/:role', UserController.getDashboardStats);
router.get('/kyc', KycController.getVerificationStatus);
router.post('/kyc', validate({ body: submitKycSchema }), KycController.submitVerification);

// Wishlist — MUST be defined BEFORE '/:id' so 'wishlist' is not captured
// by the ':id' param (which would reject it as an ObjectId).
router.get('/wishlist', UserController.getWishlist);
router.post(
  '/wishlist/:productId',
  validate({ params: wishlistProductParamsSchema }),
  UserController.addToWishlist
);
router.delete(
  '/wishlist/:productId',
  validate({ params: wishlistProductParamsSchema }),
  UserController.removeFromWishlist
);

router.get('/:id', validate({ params: userIdParamsSchema }), UserController.getUserById);

export default router;

