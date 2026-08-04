import { Router } from 'express';
import OwnerController from '../controllers/owner.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate, authorize('owner', 'admin'));

router.get('/stats', OwnerController.getStats);
router.get('/listings', OwnerController.getListings);
router.get('/bookings', OwnerController.getBookings);
router.get('/reviews', OwnerController.getReviews);
router.get('/earnings', OwnerController.getEarnings);
router.get('/verification', OwnerController.getVerificationStatus);
router.post('/verification', OwnerController.submitVerification);

export default router;

