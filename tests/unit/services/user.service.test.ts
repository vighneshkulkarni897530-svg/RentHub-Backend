// UserService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/UserRepository', () => ({
  default: {
    findById: vi.fn(),
    updateById: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/WishlistRepository', () => ({
  default: {
    findByUser: vi.fn(),
    addProduct: vi.fn(),
    removeProduct: vi.fn(),
  },
}));

// Mock dynamically imported models
vi.mock('../../../src/models/Booking', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../../../src/models/Product', () => ({
  default: {
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../../src/models/Review', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../src/models/Payment', () => ({
  default: {
    find: vi.fn(),
  },
}));

import UserService from '../../../src/services/user.service';
import UserRepository from '../../../src/repositories/UserRepository';
import WishlistRepository from '../../../src/repositories/WishlistRepository';
import Booking from '../../../src/models/Booking';
import Product from '../../../src/models/Product';
import Review from '../../../src/models/Review';
import Payment from '../../../src/models/Payment';

const mockUser = { _id: 'user1', name: 'Test' };
const mockWishlist = { user: 'user1', products: [{ _id: 'p1' }] };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UserService', () => {
  describe('updateProfile', () => {
    it('updates profile', async () => {
      (UserRepository.findById as any).mockResolvedValue(mockUser);
      (UserRepository.updateById as any).mockResolvedValue(mockUser);
      const result = await UserService.updateProfile('user1', { name: 'New Name' });
      expect(UserRepository.updateById).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws 404 when user not found', async () => {
      (UserRepository.findById as any).mockResolvedValue(null);
      await expect(UserService.updateProfile('user1', { name: 'x' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getUserById', () => {
    it('returns user', async () => {
      (UserRepository.findById as any).mockResolvedValue(mockUser);
      const result = await UserService.getUserById('user1');
      expect(result).toEqual(mockUser);
    });

    it('throws 404 when not found', async () => {
      (UserRepository.findById as any).mockResolvedValue(null);
      await expect(UserService.getUserById('user1')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getWishlist', () => {
    it('returns wishlist', async () => {
      (WishlistRepository.findByUser as any).mockResolvedValue(mockWishlist);
      const result = await UserService.getWishlist('user1');
      expect(result).toEqual(mockWishlist);
    });

    it('returns empty wishlist', async () => {
      (WishlistRepository.findByUser as any).mockResolvedValue(null);
      const result = await UserService.getWishlist('user1');
      expect(result).toEqual({ user: 'user1', products: [] });
    });
  });

  describe('addToWishlist', () => {
    it('adds product', async () => {
      (WishlistRepository.addProduct as any).mockResolvedValue(mockWishlist);
      const result = await UserService.addToWishlist('user1', 'p1');
      expect(result).toEqual(mockWishlist);
    });
  });

  describe('removeFromWishlist', () => {
    it('removes product', async () => {
      (WishlistRepository.removeProduct as any).mockResolvedValue(mockWishlist);
      const result = await UserService.removeFromWishlist('user1', 'p1');
      expect(result).toEqual(mockWishlist);
    });
  });

  describe('getDashboardStats', () => {
    it('throws 404 when user not found', async () => {
      (UserRepository.findById as any).mockResolvedValue(null);
      await expect(UserService.getDashboardStats('user1', 'customer')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('returns owner dashboard stats', async () => {
      (UserRepository.findById as any).mockResolvedValue(mockUser);
      (Product.countDocuments as any).mockResolvedValue(2);
      (Booking.countDocuments as any).mockResolvedValue(3);
      (Booking.find as any).mockResolvedValue([{ totalPrice: 500 }]);
      (Review.find as any).mockResolvedValue([{ rating: 5 }]);
      const result = await UserService.getDashboardStats('user1', 'owner');
      expect(result.totalListings).toBe(2);
      expect(result.totalEarnings).toBe(500);
    });

    it('returns admin dashboard stats', async () => {
      (UserRepository.findById as any).mockResolvedValue(mockUser);
      (UserRepository.countDocuments as any).mockResolvedValue(10);
      (Product.countDocuments as any).mockResolvedValue(5);
      (Booking.countDocuments as any).mockResolvedValue(3);
      (Payment.find as any).mockResolvedValue([{ amount: 100 }]);
      const result = await UserService.getDashboardStats('user1', 'admin');
      expect(result.totalUsers).toBe(10);
      expect(result.totalRevenue).toBe(100);
    });

    it('returns customer dashboard stats', async () => {
      (UserRepository.findById as any).mockResolvedValue(mockUser);
      (Booking.find as any).mockResolvedValue([{ status: 'active', grandTotal: 500 }]);
      (WishlistRepository.findByUser as any).mockResolvedValue(mockWishlist);
      const result = await UserService.getDashboardStats('user1', 'customer');
      expect(result.totalBookings).toBe(1);
      expect(result.activeRentals).toBe(1);
      expect(result.wishlistCount).toBe(1);
    });
  });
});
