import { Router } from 'express';
import AdminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', AdminController.getDashboardStats);
router.get('/analytics', AdminController.getAnalytics);
router.get('/users', AdminController.listUsers);
router.put('/users/:id/status', AdminController.updateUserStatus);
router.get('/products', AdminController.listProducts);
router.put('/products/:id/moderation', AdminController.moderateProduct);
router.get('/bookings', AdminController.listBookings);
router.get('/payments', AdminController.listPayments);
router.get('/categories', AdminController.listCategories);
router.put('/categories/:id', AdminController.updateCategory);
router.get('/reports', AdminController.listReports);
router.get('/support-tickets', AdminController.listSupportTickets);
router.get('/verifications', AdminController.listVerifications);
router.put('/verifications/:id/review', AdminController.reviewVerification);

export default router;

