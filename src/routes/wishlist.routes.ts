import { Router } from 'express';
import WishlistController from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { wishlistProductParamsSchema } from '../validators/wishlist';

const router = Router();

router.use(authenticate);

router.get('/', WishlistController.getWishlist);
router.post(
  '/:productId',
  validate({ params: wishlistProductParamsSchema }),
  WishlistController.addProduct
);
router.delete(
  '/:productId',
  validate({ params: wishlistProductParamsSchema }),
  WishlistController.removeProduct
);
router.get(
  '/:productId/check',
  validate({ params: wishlistProductParamsSchema }),
  WishlistController.checkWishlist
);

export default router;

