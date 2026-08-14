import { Router } from 'express';
import authRoutes from './auth.routes';
import bookingRoutes from './booking.routes';
import categoryRoutes from './category.routes';
import messageRoutes from './message.routes';
import notificationRoutes from './notification.routes';
import ownerRoutes from './owner.routes';
import paymentRoutes from './payment.routes';
import productRoutes from './product.routes';
import reportRoutes from './report.routes';
import reviewRoutes from './review.routes';
import supportTicketRoutes from './supportTicket.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import uploadRoutes from './upload.routes';
import aiRoutes from './ai.routes';
import purchaseRoutes from './purchase.routes';

const router = Router();

const apiV1Router = Router();
apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/bookings', bookingRoutes);
apiV1Router.use('/categories', categoryRoutes);
apiV1Router.use('/messages', messageRoutes);
apiV1Router.use('/notifications', notificationRoutes);
apiV1Router.use('/owner', ownerRoutes);
apiV1Router.use('/payments', paymentRoutes);
apiV1Router.use('/products', productRoutes);
apiV1Router.use('/reports', reportRoutes);
apiV1Router.use('/reviews', reviewRoutes);
apiV1Router.use('/support-tickets', supportTicketRoutes);
apiV1Router.use('/user', userRoutes);
apiV1Router.use('/admin', adminRoutes);
apiV1Router.use('/upload', uploadRoutes);
apiV1Router.use('/ai', aiRoutes);
apiV1Router.use('/purchases', purchaseRoutes);

router.use('/api/v1', apiV1Router);

export default router;