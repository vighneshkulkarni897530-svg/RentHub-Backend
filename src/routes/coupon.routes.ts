import { Router } from 'express';
import CouponController from '../controllers/coupon.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCouponSchema, applyCouponSchema, couponIdParamsSchema } from '../validators/coupon';

const router = Router();

router.use(authenticate);
router.post('/', authorize('admin', 'owner'), validate({ body: createCouponSchema }), CouponController.createCoupon);
router.get('/', CouponController.listCoupons);
router.get('/:id', validate({ params: couponIdParamsSchema }), CouponController.getCoupon);
router.post('/apply', validate({ body: applyCouponSchema }), CouponController.applyCoupon);

export default router;
