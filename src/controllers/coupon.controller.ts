import { Response } from 'express';
import CouponService from '../services/coupon.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class CouponController {
  createCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const coupon = await CouponService.createCoupon(req.body);
    res.status(201).json(ApiResponse.ok(coupon, 'Coupon created'));
  });

  applyCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await CouponService.applyCoupon(req.body);
    res.status(200).json(ApiResponse.ok(result));
  });

  getCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const coupon = await CouponService.getCouponById(req.params.id);
    res.status(200).json(ApiResponse.ok(coupon));
  });

  listCoupons = asyncHandler(async (req: AuthRequest, res: Response) => {
    const coupons = await CouponService.listCoupons({
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
    });
    res.status(200).json(ApiResponse.ok(coupons));
  });
}

export default new CouponController();
