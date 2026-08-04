import UserRepository from '../repositories/UserRepository';
import ProductRepository from '../repositories/ProductRepository';
import BookingRepository from '../repositories/BookingRepository';
import PaymentRepository from '../repositories/PaymentRepository';
import ReportRepository from '../repositories/ReportRepository';
import SupportTicketRepository from '../repositories/SupportTicketRepository';
import CategoryRepository from '../repositories/CategoryRepository';
import KycVerificationRepository from '../repositories/KycVerificationRepository';

export class AdminService {
  async getDashboardStats() {
    const [totalUsers, totalOwners, totalAdmins, totalProducts, totalBookings, pendingProducts, pendingBookings, totalReports, totalRevenue, openTickets, pendingVerifications] =
      await Promise.all([
        UserRepository.countDocuments({ role: 'customer' }),
        UserRepository.countDocuments({ role: 'owner' }),
        UserRepository.countDocuments({ role: 'admin' }),
        ProductRepository.countDocuments({}),
        BookingRepository.countDocuments({}),
        ProductRepository.countDocuments({ moderationStatus: 'pending' }),
        BookingRepository.countDocuments({ status: 'pending' }),
        ReportRepository.countDocuments({ status: 'open' }),
        PaymentRepository.sumRevenue(),
        SupportTicketRepository.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
        KycVerificationRepository.countDocuments({ status: 'pending' }),
      ]);

    return {
      totalUsers,
      totalOwners,
      totalAdmins,
      totalProducts,
      totalBookings,
      pendingProducts,
      pendingBookings,
      totalReports,
      totalRevenue,
      openTickets,
      pendingVerifications,
      activeUsers: await UserRepository.countDocuments({ status: 'active' }),
      platformFee: 10,
      monthlyGrowth: 8.2,
    };
  }

  async listUsers(options: any) {
    const filter: Record<string, unknown> = {};
    if (options.role) filter.role = options.role;
    if (options.status) filter.status = options.status;
    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
      ];
    }
    return UserRepository.listUsers(filter as any, options);
  }

  async updateUserStatus(userId: string, status: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return UserRepository.updateById(userId, { status });
  }

  async listProducts(options: any) {
    const filter: Record<string, unknown> = {};
    if (options.status) filter.moderationStatus = options.status;
    if (options.listingStatus) filter.listingStatus = options.listingStatus;
    if (options.owner) filter.owner = options.owner;
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await ProductRepository.countDocuments(filter as any);
    const data = await ProductRepository.find(filter as any, {
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'owner', select: 'name email avatar' },
      ],
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async moderateProduct(productId: string, status: string) {
    const product = await ProductRepository.findById(productId);
    if (!product) throw new Error('Product not found');
    return ProductRepository.updateById(productId, {
      moderationStatus: status,
      listingStatus: status === 'approved' ? 'active' : 'inactive',
    });
  }

  async listBookings(options: any) {
    return BookingRepository.listAll(options);
  }

  async listPayments(options: any) {
    return PaymentRepository.listAll(options);
  }

  async listCategories() {
    return CategoryRepository.find({}, { sort: { name: 1 as 1 | -1 } });
  }

  async updateCategory(categoryId: string, input: Record<string, unknown>) {
    return CategoryRepository.updateById(categoryId, input);
  }

  async listReports(options: any) {
    return ReportRepository.listAll(options);
  }

  async listSupportTickets(options: any) {
    return SupportTicketRepository.listAll(options);
  }

  async listVerifications(options: any) {
    return KycVerificationRepository.listAll(options);
  }

  async getAnalytics() {
    const [totalUsers, totalProducts, totalBookings, completedBookings] = await Promise.all([
      UserRepository.countDocuments({}),
      ProductRepository.countDocuments({}),
      BookingRepository.countDocuments({}),
      BookingRepository.find({ status: 'completed' }),
    ]);

    const totalRevenue = completedBookings.reduce((s: number, b: any) => s + (b.grandTotal || b.totalPrice || 0), 0);

    return {
      pageViews: 125000,
      uniqueVisitors: 45000,
      bounceRate: 38.2,
      avgSessionDuration: 4.5,
      conversionRate: 3.2,
      totalUsers,
      totalProducts,
      totalBookings,
      totalRevenue,
      revenueGrowth: 12.5,
      ordersGrowth: 8.3,
      topCategories: [],
      topProducts: [],
      revenueByMonth: [],
      visitorsByDay: [],
      userGrowth: [],
    };
  }
}

export default new AdminService();

