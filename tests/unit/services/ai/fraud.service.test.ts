// FraudService unit tests — repositories mocked

vi.mock('../../../../src/repositories/FraudAlertRepository', () => ({
  default: {
    createAlert: vi.fn(),
    listAll: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/UserRepository', () => ({
  default: {
    findById: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/ProductRepository', () => ({
  default: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/BookingRepository', () => ({
  default: {
    findById: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/ReviewRepository', () => ({
  default: {
    findById: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

import FraudService from '../../../../src/services/ai/fraud.service';
import UserRepository from '../../../../src/repositories/UserRepository';
import ProductRepository from '../../../../src/repositories/ProductRepository';
import BookingRepository from '../../../../src/repositories/BookingRepository';
import ReviewRepository from '../../../../src/repositories/ReviewRepository';
import FraudAlertRepository from '../../../../src/repositories/FraudAlertRepository';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FraudService', () => {
  describe('scoreUser', () => {
    it('returns zero score for non-existent user', async () => {
      (UserRepository.findById as any).mockResolvedValue(null);
      const result = await FraudService.scoreUser('user1');
      expect(result.score).toBe(0);
    });

    it('flags new unverified user with disposable email', async () => {
      (UserRepository.findById as any).mockResolvedValue({
        createdAt: new Date(),
        verified: false,
        isEmailVerified: false,
        name: 'ab',
        email: 'temp-user@mailinator.com',
      });
      (UserRepository.countDocuments as any).mockResolvedValue(0);
      const result = await FraudService.scoreUser('user1');
      expect(result.score).toBeGreaterThan(0);
      expect(result.signals.length).toBeGreaterThan(0);
    });

    it('returns low score for verified established user', async () => {
      (UserRepository.findById as any).mockResolvedValue({
        createdAt: new Date(Date.now() - 90 * 86400000),
        verified: true,
        isEmailVerified: true,
        name: 'John Doe',
        email: 'john@example.com',
      });
      (UserRepository.countDocuments as any).mockResolvedValue(0);
      const result = await FraudService.scoreUser('user1');
      expect(result.score).toBe(0);
    });
  });

  describe('scoreProduct', () => {
    it('returns zero for non-existent product', async () => {
      (ProductRepository.findById as any).mockResolvedValue(null);
      const result = await FraudService.scoreProduct('p1');
      expect(result.score).toBe(0);
    });

    it('flags all-caps title and no images', async () => {
      (ProductRepository.findById as any).mockResolvedValue({
        _id: 'p1',
        title: 'AMAZING CAMERA FOR RENT',
        description: 'Great!!!',
        rentalPrice: 3,
        images: [],
      });
      (ProductRepository.find as any).mockResolvedValue([]);
      const result = await FraudService.scoreProduct('p1');
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('scoreBooking', () => {
    it('flags zero price booking', async () => {
      (BookingRepository.findById as any).mockResolvedValue({
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 2 * 86400000),
        totalPrice: 0,
        renter: 'r1',
        product: 'p1',
      });
      (BookingRepository.countDocuments as any).mockResolvedValue(0);
      const result = await FraudService.scoreBooking('b1');
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('scoreReview', () => {
    it('flags 5-star review with no detail', async () => {
      (ReviewRepository.findById as any).mockResolvedValue({ rating: 5, comment: '', user: 'u1', product: 'p1' });
      (ReviewRepository.countDocuments as any).mockResolvedValue(1);
      const result = await FraudService.scoreReview('r1');
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('scanAndCreateAlerts', () => {
it('creates alerts for high-risk users and products', async () => {
      const highRiskUser = { _id: 'u1', name: 'ab', createdAt: new Date(), verified: false, isEmailVerified: false, email: 'x@mailinator.com' };
      (UserRepository.find as any).mockResolvedValue([highRiskUser]);
      (UserRepository.findById as any).mockResolvedValue(highRiskUser);
      (UserRepository.countDocuments as any).mockResolvedValue(0);
      (ProductRepository.find as any).mockResolvedValue([]);
      (FraudAlertRepository.createAlert as any).mockImplementation((a: any) => Promise.resolve(a));
      const alerts = await FraudService.scanAndCreateAlerts({ limit: 10 });
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('listAlerts', () => {
    it('lists alerts', async () => {
      (FraudAlertRepository.listAll as any).mockResolvedValue([{ _id: 'a1' }]);
      const result = await FraudService.listAlerts({});
      expect(result).toEqual([{ _id: 'a1' }]);
    });
  });

  describe('updateAlertStatus', () => {
    it('updates alert status', async () => {
      (FraudAlertRepository.updateStatus as any).mockResolvedValue({ _id: 'a1' });
      const result = await FraudService.updateAlertStatus('a1', 'resolved', 'admin1');
      expect(result).toEqual({ _id: 'a1' });
    });
  });
});
