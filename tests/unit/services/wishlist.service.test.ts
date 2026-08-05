// WishlistService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/WishlistRepository', () => ({
  default: {
    findByUser: vi.fn(),
    addProduct: vi.fn(),
    removeProduct: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ProductRepository', () => ({
  default: {
    findById: vi.fn(),
  },
}));

import WishlistService from '../../../src/services/wishlist.service';
import WishlistRepository from '../../../src/repositories/WishlistRepository';
import ProductRepository from '../../../src/repositories/ProductRepository';

const mockWishlist = {
  user: 'user1',
  products: [{ _id: 'prod1' }, { _id: 'prod2' }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WishlistService', () => {
  describe('getWishlist', () => {
    it('returns existing wishlist', async () => {
      (WishlistRepository.findByUser as any).mockResolvedValue(mockWishlist);
      const result = await WishlistService.getWishlist('user1');
      expect(result).toEqual(mockWishlist);
    });

    it('returns empty wishlist when none exists', async () => {
      (WishlistRepository.findByUser as any).mockResolvedValue(null);
      const result = await WishlistService.getWishlist('user1');
      expect(result).toEqual({ user: 'user1', products: [] });
    });
  });

  describe('addProduct', () => {
    it('adds product to wishlist', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ _id: 'prod1' });
      (WishlistRepository.addProduct as any).mockResolvedValue(mockWishlist);
      const result = await WishlistService.addProduct('user1', 'prod1');
      expect(WishlistRepository.addProduct).toHaveBeenCalledWith('user1', 'prod1');
      expect(result).toEqual(mockWishlist);
    });

    it('throws 404 when product not found', async () => {
      (ProductRepository.findById as any).mockResolvedValue(null);
      await expect(WishlistService.addProduct('user1', 'bad')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('removeProduct', () => {
    it('removes product from wishlist', async () => {
      (WishlistRepository.findByUser as any).mockResolvedValue(mockWishlist);
      (WishlistRepository.removeProduct as any).mockResolvedValue(mockWishlist);
      const result = await WishlistService.removeProduct('user1', 'prod1');
      expect(WishlistRepository.removeProduct).toHaveBeenCalledWith('user1', 'prod1');
      expect(result).toEqual(mockWishlist);
    });

    it('throws 404 when wishlist not found', async () => {
      (WishlistRepository.findByUser as any).mockResolvedValue(null);
      await expect(WishlistService.removeProduct('user1', 'prod1')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('isInWishlist', () => {
    it('returns true when product in wishlist', async () => {
      (WishlistRepository.findByUser as any).mockResolvedValue(mockWishlist);
      const result = await WishlistService.isInWishlist('user1', 'prod1');
      expect(result).toBe(true);
    });

    it('returns false when product not in wishlist', async () => {
      (WishlistRepository.findByUser as any).mockResolvedValue(mockWishlist);
      const result = await WishlistService.isInWishlist('user1', 'nonexistent');
      expect(result).toBe(false);
    });

    it('returns false when no wishlist', async () => {
      (WishlistRepository.findByUser as any).mockResolvedValue(null);
      const result = await WishlistService.isInWishlist('user1', 'prod1');
      expect(result).toBe(false);
    });
  });
});
