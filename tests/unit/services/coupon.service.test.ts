// CouponService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/CouponRepository', () => ({
  default: {
    create: vi.fn(),
    findByCode: vi.fn(),
    updateById: vi.fn(),
    findById: vi.fn(),
    listAll: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ProductRepository', () => ({
  default: {
    findById: vi.fn(),
  },
}));

import CouponService from '../../../src/services/coupon.service';
import CouponRepository from '../../../src/repositories/CouponRepository';
import ProductRepository from '../../../src/repositories/ProductRepository';

const mockCoupon = {
  id: 'cp1',
  code: 'SAVE10',
  couponType: 'fixed',
  value: 10,
  minOrderAmount: 50,
  maxDiscount: 10,
  validFrom: new Date(Date.now() - 100000),
  validUntil: new Date(Date.now() + 100000),
  usageLimit: 100,
  usedCount: 0,
  isActive: true,
  productIds: [],
  categoryIds: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CouponService', () => {
  describe('createCoupon', () => {
    it('creates a coupon', async () => {
      (CouponRepository.create as any).mockResolvedValue(mockCoupon);
      const result = await CouponService.createCoupon({
        code: 'save10',
        couponType: 'fixed',
        value: 10,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86400000).toISOString(),
      } as any);
      expect(result).toBeDefined();
      expect(CouponRepository.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'SAVE10' }));
    });

    it('throws 400 when validUntil before validFrom', async () => {
      await expect(
        CouponService.createCoupon({
          code: 'save10',
          couponType: 'fixed',
          value: 10,
          validFrom: new Date(Date.now() + 86400000).toISOString(),
          validUntil: new Date().toISOString(),
        } as any)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('applyCoupon', () => {
    it('applies fixed coupon discount', async () => {
      (CouponRepository.findByCode as any).mockResolvedValue(mockCoupon);
      const result = await CouponService.applyCoupon({ couponCode: 'SAVE10', totalPrice: 100 });
      expect(result.couponDiscount).toBe(10);
      expect(result.couponCode).toBe('SAVE10');
    });

    it('applies percentage coupon', async () => {
      (CouponRepository.findByCode as any).mockResolvedValue({
        ...mockCoupon,
        couponType: 'percentage',
        value: 20,
        maxDiscount: 15,
      });
      const result = await CouponService.applyCoupon({ couponCode: 'SAVE20', totalPrice: 100 });
      expect(result.couponDiscount).toBe(15);
    });

    it('throws 404 when coupon not found', async () => {
      (CouponRepository.findByCode as any).mockResolvedValue(null);
      await expect(CouponService.applyCoupon({ couponCode: 'X', totalPrice: 100 })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 400 when coupon expired', async () => {
      (CouponRepository.findByCode as any).mockResolvedValue({
        ...mockCoupon,
        validUntil: new Date(Date.now() - 100000),
      });
      await expect(CouponService.applyCoupon({ couponCode: 'SAVE10', totalPrice: 100 })).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('throws 400 when usage limit reached', async () => {
      (CouponRepository.findByCode as any).mockResolvedValue({ ...mockCoupon, usageLimit: 5, usedCount: 5 });
      await expect(CouponService.applyCoupon({ couponCode: 'SAVE10', totalPrice: 100 })).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('throws 400 when below min order amount', async () => {
      (CouponRepository.findByCode as any).mockResolvedValue(mockCoupon);
      await expect(CouponService.applyCoupon({ couponCode: 'SAVE10', totalPrice: 10 })).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('validates product-specific coupon', async () => {
      (CouponRepository.findByCode as any).mockResolvedValue({ ...mockCoupon, productIds: ['prod1'] });
      (ProductRepository.findById as any).mockResolvedValue({ _id: 'prod2', category: 'cat1' });
      await expect(
        CouponService.applyCoupon({ couponCode: 'SAVE10', totalPrice: 100, productId: 'prod2' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('redeemCoupon', () => {
    it('increments usedCount', async () => {
      (CouponRepository.findByCode as any).mockResolvedValue(mockCoupon);
      (CouponRepository.updateById as any).mockResolvedValue(mockCoupon);
      await CouponService.redeemCoupon('SAVE10');
      expect(CouponRepository.updateById).toHaveBeenCalledWith('cp1', { usedCount: 1 });
    });

    it('throws 404 when coupon not found', async () => {
      (CouponRepository.findByCode as any).mockResolvedValue(null);
      await expect(CouponService.redeemCoupon('X')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getCouponById', () => {
    it('returns coupon', async () => {
      (CouponRepository.findById as any).mockResolvedValue(mockCoupon);
      const result = await CouponService.getCouponById('cp1');
      expect(result).toEqual(mockCoupon);
    });

    it('throws 404 when not found', async () => {
      (CouponRepository.findById as any).mockResolvedValue(null);
      await expect(CouponService.getCouponById('cp1')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('listCoupons', () => {
    it('lists coupons', async () => {
      (CouponRepository.listAll as any).mockResolvedValue([mockCoupon]);
      const result = await CouponService.listCoupons({});
      expect(result).toEqual([mockCoupon]);
    });
  });
});
