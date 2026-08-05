// AdminService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/UserRepository', () => ({
  default: {
    countDocuments: vi.fn(),
    listUsers: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ProductRepository', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/BookingRepository', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn(),
    listAll: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/PaymentRepository', () => ({
  default: {
    sumRevenue: vi.fn(),
    listAll: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ReportRepository', () => ({
  default: {
    countDocuments: vi.fn(),
    listAll: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/SupportTicketRepository', () => ({
  default: {
    countDocuments: vi.fn(),
    listAll: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/CategoryRepository', () => ({
  default: {
    find: vi.fn(),
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/KycVerificationRepository', () => ({
  default: {
    countDocuments: vi.fn(),
    listAll: vi.fn(),
  },
}));

import AdminService from '../../../src/services/admin.service';
import UserRepository from '../../../src/repositories/UserRepository';
import ProductRepository from '../../../src/repositories/ProductRepository';
import BookingRepository from '../../../src/repositories/BookingRepository';
import PaymentRepository from '../../../src/repositories/PaymentRepository';
import ReportRepository from '../../../src/repositories/ReportRepository';
import SupportTicketRepository from '../../../src/repositories/SupportTicketRepository';
import CategoryRepository from '../../../src/repositories/CategoryRepository';
import KycVerificationRepository from '../../../src/repositories/KycVerificationRepository';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminService', () => {
  describe('getDashboardStats', () => {
    it('returns dashboard stats', async () => {
      (UserRepository.countDocuments as any).mockResolvedValue(10);
      (ProductRepository.countDocuments as any).mockResolvedValue(5);
      (BookingRepository.countDocuments as any).mockResolvedValue(3);
      (ReportRepository.countDocuments as any).mockResolvedValue(1);
      (PaymentRepository.sumRevenue as any).mockResolvedValue(1000);
      (SupportTicketRepository.countDocuments as any).mockResolvedValue(2);
      (KycVerificationRepository.countDocuments as any).mockResolvedValue(1);

      const result = await AdminService.getDashboardStats();
      expect(result.totalUsers).toBe(10);
      expect(result.totalOwners).toBe(10);
      expect(result.totalAdmins).toBe(10);
      expect(result.totalProducts).toBe(5);
      expect(result.totalRevenue).toBe(1000);
    });
  });

  describe('listUsers', () => {
    it('lists users with filters', async () => {
      (UserRepository.listUsers as any).mockResolvedValue({ data: [], total: 0 });
      const result = await AdminService.listUsers({ role: 'owner' });
      expect(UserRepository.listUsers).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('updateUserStatus', () => {
    it('updates user status', async () => {
      (UserRepository.findById as any).mockResolvedValue({ _id: 'user1' });
      (UserRepository.updateById as any).mockResolvedValue({});
      const result = await AdminService.updateUserStatus('user1', 'suspended');
      expect(UserRepository.updateById).toHaveBeenCalledWith('user1', { status: 'suspended' });
    });
  });

  describe('listProducts', () => {
    it('lists products with moderation filter', async () => {
      (ProductRepository.countDocuments as any).mockResolvedValue(2);
      (ProductRepository.find as any).mockResolvedValue([{ _id: 'p1' }]);
      const result = await AdminService.listProducts({ status: 'pending' });
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('moderateProduct', () => {
    it('approves a product', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ _id: 'p1' });
      (ProductRepository.updateById as any).mockResolvedValue({});
      const result = await AdminService.moderateProduct('p1', 'approved');
      expect(ProductRepository.updateById).toHaveBeenCalledWith('p1', {
        moderationStatus: 'approved',
        listingStatus: 'active',
      });
    });
  });

  describe('listBookings', () => {
    it('lists bookings', async () => {
      (BookingRepository.listAll as any).mockResolvedValue({ data: [], total: 0 });
      const result = await AdminService.listBookings({});
      expect(result).toBeDefined();
    });
  });

  describe('listPayments', () => {
    it('lists payments', async () => {
      (PaymentRepository.listAll as any).mockResolvedValue([]);
      const result = await AdminService.listPayments({});
      expect(result).toEqual([]);
    });
  });

  describe('listCategories', () => {
    it('lists categories', async () => {
      (CategoryRepository.find as any).mockResolvedValue([{ _id: 'c1' }]);
      const result = await AdminService.listCategories();
      expect(result).toEqual([{ _id: 'c1' }]);
    });
  });

  describe('updateCategory', () => {
    it('updates category', async () => {
      (CategoryRepository.updateById as any).mockResolvedValue({ _id: 'c1' });
      const result = await AdminService.updateCategory('c1', { name: 'x' });
      expect(result).toEqual({ _id: 'c1' });
    });
  });

  describe('listReports', () => {
    it('lists reports', async () => {
      (ReportRepository.listAll as any).mockResolvedValue([]);
      const result = await AdminService.listReports({});
      expect(result).toEqual([]);
    });
  });

  describe('listSupportTickets', () => {
    it('lists support tickets', async () => {
      (SupportTicketRepository.listAll as any).mockResolvedValue([]);
      const result = await AdminService.listSupportTickets({});
      expect(result).toEqual([]);
    });
  });

  describe('listVerifications', () => {
    it('lists verifications', async () => {
      (KycVerificationRepository.listAll as any).mockResolvedValue([]);
      const result = await AdminService.listVerifications({});
      expect(result).toEqual([]);
    });
  });

  describe('getAnalytics', () => {
    it('returns analytics', async () => {
      (UserRepository.countDocuments as any).mockResolvedValue(10);
      (ProductRepository.countDocuments as any).mockResolvedValue(5);
      (BookingRepository.countDocuments as any).mockResolvedValue(3);
      (BookingRepository.find as any).mockResolvedValue([{ grandTotal: 500 }, { totalPrice: 300 }]);
      const result = await AdminService.getAnalytics();
      expect(result.totalRevenue).toBe(800);
    });
  });
});
