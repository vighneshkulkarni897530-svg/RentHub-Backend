import ProductRepository from '../../repositories/ProductRepository';
import BookingRepository from '../../repositories/BookingRepository';
import UserRepository from '../../repositories/UserRepository';
import CategoryRepository from '../../repositories/CategoryRepository';
import PaymentRepository from '../../repositories/PaymentRepository';
import AIInsightRepository from '../../repositories/AIInsightRepository';
import { clamp01 } from '../../utils/ai/image';

/**
 * Insights service: owner insights + admin AI dashboard.
 * Revenue forecast, booking prediction, demand trends, peak seasons,
 * inventory utilization, best categories, and admin-level analytics.
 */
export class InsightsService {
  // ================= OWNER INSIGHTS =================

  async ownerInsights(ownerId: string) {
    const cached = await AIInsightRepository.getCached('owner_revenue_forecast', 'owner', ownerId);
    if (cached) return cached.data;

    const products = await ProductRepository.find({ owner: ownerId as any });
    const bookings = await BookingRepository.find({ owner: ownerId as any });

    const productList = products as any[];
    const bookingList = bookings as any[];

    // Revenue forecast (next 30 days based on recent trend).
    const revenueForecast = this.revenueForecast(bookingList);

    // Booking prediction (next 30 days).
    const bookingPrediction = this.bookingPrediction(bookingList);

    // Demand trend (last 6 months).
    const demandTrend = this.demandTrend(bookingList);

    // Peak rental season.
    const peakSeason = this.peakSeason(bookingList);

    // Inventory utilization.
    const inventoryUtilization = this.inventoryUtilization(productList, bookingList);

    // Best performing categories.
    const bestCategories = this.bestCategories(productList, bookingList);

    const data = {
      revenueForecast,
      bookingPrediction,
      demandTrend,
      peakSeason,
      inventoryUtilization,
      bestCategories,
      totalProducts: productList.length,
      totalBookings: bookingList.length,
    };

    await AIInsightRepository.cache({
      type: 'owner_revenue_forecast',
      scope: 'owner',
      ownerId: ownerId as any,
      data,
      confidence: 0.8,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    });

    return data;
  }

  // ================= ADMIN AI DASHBOARD =================

  async adminDashboard() {
    const cached = await AIInsightRepository.getCached('admin_revenue_prediction', 'global');
    if (cached) return cached.data;

    const bookings = await BookingRepository.find({});
    const products = await ProductRepository.find({});
    const users = await UserRepository.find({});
    const payments = await PaymentRepository.find({});

    const bookingList = bookings as any[];
    const productList = products as any[];
    const userList = users as any[];
    const paymentList = payments as any[];

    // Revenue prediction (next 90 days).
    const revenuePrediction = this.revenueForecast(bookingList, 90);

    // Growth forecast.
    const growthForecast = this.growthForecast(userList, bookingList, productList);

    // Popular categories.
    const popularCategories = this.popularCategories(productList, bookingList);

    // Most profitable cities.
    const profitableCities = this.profitableCities(productList, bookingList);

    // User behavior summary.
    const userBehavior = this.userBehavior(userList, bookingList);

    const data = {
      revenuePrediction,
      growthForecast,
      popularCategories,
      profitableCities,
      userBehavior,
      fraudAlerts: await this.fraudAlertSummary(),
    };

    await AIInsightRepository.cache({
      type: 'admin_revenue_prediction',
      scope: 'global',
      data,
      confidence: 0.8,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    });

    return data;
  }

  // ================= Helpers =================

  private revenueForecast(bookings: any[], days = 30) {
    const now = Date.now();
    const recent = bookings.filter((b) => new Date(b.createdAt).getTime() > now - 30 * 86400000);
    const avgDaily = recent.length ? recent.reduce((s, b) => s + (b.grandTotal || b.totalPrice || 0), 0) / 30 : 0;
    const projection = avgDaily * days;
    const growth = this.calcGrowth(recent);
    return {
      projectedRevenue: Math.round(projection),
      avgDailyRevenue: Math.round(avgDaily),
      periodDays: days,
      growthRate: growth,
      confidence: clamp01(0.5 + recent.length / 50),
    };
  }

  private bookingPrediction(bookings: any[]) {
    const now = Date.now();
    const recent = bookings.filter((b) => new Date(b.createdAt).getTime() > now - 30 * 86400000);
    const avgDaily = recent.length / 30;
    const projected = Math.round(avgDaily * 30);
    return {
      predictedBookings: projected,
      avgDailyBookings: Math.round(avgDaily * 10) / 10,
      confidence: clamp01(0.5 + recent.length / 100),
    };
  }

  private demandTrend(bookings: any[]) {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleString('en-US', { month: 'short' });
    });
    const counts = months.map((month) => {
      const idx = months.indexOf(month);
      const start = new Date();
      start.setMonth(start.getMonth() - (5 - idx));
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return bookings.filter((b) => {
        const t = new Date(b.createdAt).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length;
    });
    return { months, counts };
  }

  private peakSeason(bookings: any[]) {
    const monthCounts = new Array(12).fill(0);
    for (const b of bookings) {
      const m = new Date(b.startDate).getMonth();
      monthCounts[m]++;
    }
    let peak = 0;
    let peakCount = 0;
    for (let i = 0; i < 12; i++) {
      if (monthCounts[i] > peakCount) {
        peakCount = monthCounts[i];
        peak = i;
      }
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      peakMonth: months[peak],
      peakMonthIndex: peak,
      monthDistribution: months.map((m, i) => ({ month: m, count: monthCounts[i] })),
    };
  }

  private inventoryUtilization(products: any[], bookings: any[]) {
    if (!products.length) return { utilization: 0, rentedItems: 0, totalItems: 0 };
    const activeBookings = bookings.filter((b) => ['confirmed', 'active'].includes(b.status));
    const rentedProductIds = new Set(activeBookings.map((b) => String(b.product?._id || b.product)));
    const utilization = Math.round((rentedProductIds.size / products.length) * 1000) / 10;
    return {
      utilization,
      rentedItems: rentedProductIds.size,
      totalItems: products.length,
    };
  }

  private bestCategories(products: any[], bookings: any[]) {
    const catMap = new Map<string, { name: string; revenue: number; bookings: number }>();
    for (const p of products) {
      const catId = String(p.category?._id || p.category);
      const catName = p.category?.name || 'General';
      if (!catMap.has(catId)) catMap.set(catId, { name: catName, revenue: 0, bookings: 0 });
    }
    for (const b of bookings) {
      const catId = String(b.product?.category?._id || b.product?.category);
      if (catMap.has(catId)) {
        const entry = catMap.get(catId)!;
        entry.revenue += b.grandTotal || b.totalPrice || 0;
        entry.bookings++;
      }
    }
    return Array.from(catMap.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  private growthForecast(users: any[], bookings: any[], products: any[]) {
    const now = Date.now();
    const last30 = users.filter((u) => new Date((u as any).createdAt || u.lastActive).getTime() > now - 30 * 86400000).length;
    const prev30 = users.filter((u) => {
      const t = new Date((u as any).createdAt || u.lastActive).getTime();
      return t > now - 60 * 86400000 && t <= now - 30 * 86400000;
    }).length;
    const growthRate = prev30 ? Math.round(((last30 - prev30) / prev30) * 100) : 10;
    return {
      projectedUsers: Math.round(users.length * (1 + growthRate / 100)),
      growthRate,
      newUsersLast30: last30,
      totalUsers: users.length,
    };
  }

  private popularCategories(products: any[], bookings: any[]) {
    const catMap = new Map<string, { name: string; count: number; revenue: number }>();
    for (const p of products) {
      const name = p.category?.name || 'General';
      const key = name;
      if (!catMap.has(key)) catMap.set(key, { name, count: 0, revenue: 0 });
      catMap.get(key)!.count++;
    }
    for (const b of bookings) {
      const name = b.product?.category?.name || 'General';
      if (catMap.has(name)) {
        catMap.get(name)!.revenue += b.grandTotal || b.totalPrice || 0;
      }
    }
    return Array.from(catMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }

  private profitableCities(products: any[], bookings: any[]) {
    const cityMap = new Map<string, { city: string; revenue: number; bookings: number }>();
    for (const p of products) {
      const city = p.location?.city || 'Unknown';
      if (!cityMap.has(city)) cityMap.set(city, { city, revenue: 0, bookings: 0 });
    }
    for (const b of bookings) {
      const city = b.product?.location?.city || 'Unknown';
      if (cityMap.has(city)) {
        const entry = cityMap.get(city)!;
        entry.revenue += b.grandTotal || b.totalPrice || 0;
        entry.bookings++;
      }
    }
    return Array.from(cityMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }

  private userBehavior(users: any[], bookings: any[]) {
    const owners = users.filter((u) => u.role === 'owner').length;
    const customers = users.filter((u) => u.role === 'customer').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled' || b.status === 'declined').length;
    const completionRate = bookings.length ? Math.round((completed / bookings.length) * 100) : 0;
    return { owners, customers, completedBookings: completed, cancelledBookings: cancelled, completionRate };
  }

  private async fraudAlertSummary() {
    const FraudAlertRepository = (await import('../../repositories/FraudAlertRepository')).default;
    const open = await FraudAlertRepository.countDocuments({ status: { $in: ['open', 'investigating'] } });
    const critical = await FraudAlertRepository.countDocuments({ status: 'open', severity: 'critical' });
    return { openAlerts: open, criticalAlerts: critical };
  }

  private calcGrowth(recent: any[]): number {
    if (!recent.length) return 0;
    const half = Math.floor(recent.length / 2);
    const first = recent.slice(0, half).reduce((s, b) => s + (b.grandTotal || b.totalPrice || 0), 0);
    const second = recent.slice(half).reduce((s, b) => s + (b.grandTotal || b.totalPrice || 0), 0);
    if (!first) return 0;
    return Math.round(((second - first) / first) * 100);
  }
}

export default new InsightsService();
