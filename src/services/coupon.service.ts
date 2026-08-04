import ApiError from '../utils/ApiError';
import CouponRepository from '../repositories/CouponRepository';
import ProductRepository from '../repositories/ProductRepository';
import { CreateCouponInput } from '../validators/coupon';

export class CouponService {
  async createCoupon(input: CreateCouponInput) {
    const validFrom = new Date(input.validFrom);
    const validUntil = new Date(input.validUntil);
    if (validFrom >= validUntil) throw new ApiError(400, 'Coupon validUntil must be after validFrom');

    const coupon = await CouponRepository.create({
      code: input.code.toUpperCase(),
      description: input.description || '',
      couponType: input.couponType,
      value: input.value,
      minOrderAmount: input.minOrderAmount,
      maxDiscount: input.maxDiscount,
      validFrom,
      validUntil,
      usageLimit: input.usageLimit,
      usedCount: 0,
      isActive: input.isActive,
      ownerId: input.ownerId as any,
      categoryIds: input.categoryIds as any,
      productIds: input.productIds as any,
    });
    return coupon;
  }

  async applyCoupon(input: { couponCode: string; productId?: string; totalPrice: number }) {
    const coupon = await CouponRepository.findByCode(input.couponCode);
    if (!coupon) throw new ApiError(404, 'Coupon not found or not active');

    const now = new Date();
    if (coupon.validFrom > now || coupon.validUntil < now) {
      throw new ApiError(400, 'Coupon is not valid at this time');
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, 'Coupon usage limit has been reached');
    }

    if (input.totalPrice < coupon.minOrderAmount) {
      throw new ApiError(400, `Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
    }

    if (input.productId) {
      const product = await ProductRepository.findById(input.productId);
      if (!product) throw new ApiError(404, 'Product not found');

      if (coupon.productIds.length && !coupon.productIds.some((id) => id.toString() === input.productId)) {
        throw new ApiError(400, 'Coupon is not valid for this product');
      }

      if (coupon.categoryIds.length && !coupon.categoryIds.some((id) => product.category.toString() === id.toString())) {
        throw new ApiError(400, 'Coupon is not valid for this product category');
      }
    }

    const discount = coupon.couponType === 'percentage'
      ? Math.min(Math.round((coupon.value / 100) * input.totalPrice * 100) / 100, coupon.maxDiscount || Number.POSITIVE_INFINITY)
      : Math.min(coupon.value, coupon.maxDiscount || coupon.value);

    return {
      couponCode: coupon.code,
      couponDiscount: discount,
      couponType: coupon.couponType,
      couponId: coupon.id,
    };
  }

  async redeemCoupon(code: string) {
    const coupon = await CouponRepository.findByCode(code);
    if (!coupon) throw new ApiError(404, 'Coupon not found');
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, 'Coupon usage limit has been reached');
    }
    return CouponRepository.updateById(coupon.id, { usedCount: coupon.usedCount + 1 });
  }

  async listCoupons(options: any) {
    return CouponRepository.listAll(options);
  }

  async getCouponById(id: string) {
    const coupon = await CouponRepository.findById(id);
    if (!coupon) throw new ApiError(404, 'Coupon not found');
    return coupon;
  }
}

export default new CouponService();
