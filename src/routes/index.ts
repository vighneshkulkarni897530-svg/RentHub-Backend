import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import reviewRoutes from './review.routes';
import wishlistRoutes from './wishlist.routes';
import messageRoutes from './message.routes';
import notificationRoutes from './notification.routes';
import reportRoutes from './report.routes';
import supportTicketRoutes from './supportTicket.routes';
import ownerRoutes from './owner.routes';
import adminRoutes from './admin.routes';
import uploadRoutes from './upload.routes';
import kycRoutes from './kyc.routes';
import damageRoutes from './damage.routes';
import couponRoutes from './coupon.routes';
import aiRoutes from './ai.routes';
import { liveness, readiness, metrics } from '../controllers/health.controller';

const router = Router();

// Public health check (existing contract preserved)
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'RentHub API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
  });
});

// Liveness / readiness / metrics probes (for Docker/K8s)
router.get('/health/liveness', liveness);
router.get('/health/readiness', readiness);
router.get('/health/metrics', metrics);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/support-tickets', supportTicketRoutes);
router.use('/owner', ownerRoutes);
router.use('/admin', adminRoutes);
router.use('/kyc', kycRoutes);
router.use('/damage', damageRoutes);
router.use('/coupons', couponRoutes);
router.use('/uploads', uploadRoutes);
router.use('/ai', aiRoutes);

export default router;

