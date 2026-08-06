import { Router } from 'express';
import DeliveryController from '../controllers/delivery.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createPartnerSchema,
  updatePartnerSchema,
  partnerIdParamsSchema,
  assignPartnerSchema,
  bookingIdParamsSchema,
  schedulePickupSchema,
  updateDeliveryStatusSchema,
  verifyOtpSchema,
  listPartnersQuerySchema,
} from '../validators/delivery';

const router = Router();

router.use(authenticate);

// Partners
router.get('/partners', validate({ query: listPartnersQuerySchema }), DeliveryController.getPartners);
router.post('/partners', authorize('admin'), validate({ body: createPartnerSchema }), DeliveryController.createPartner);
router.put('/partners/:id', authorize('admin'), validate({ params: partnerIdParamsSchema, body: updatePartnerSchema }), DeliveryController.updatePartner);

// Booking delivery operations
router.put('/:id/assign', validate({ params: bookingIdParamsSchema, body: assignPartnerSchema }), DeliveryController.assignPartner);
router.put('/:id/pickup', validate({ params: bookingIdParamsSchema, body: schedulePickupSchema }), DeliveryController.schedulePickup);
router.put('/:id/status', validate({ params: bookingIdParamsSchema, body: updateDeliveryStatusSchema }), DeliveryController.updateDeliveryStatus);
router.post('/:id/otp', validate({ params: bookingIdParamsSchema }), DeliveryController.generateOtp);
router.post('/:id/otp/verify', validate({ params: bookingIdParamsSchema, body: verifyOtpSchema }), DeliveryController.verifyOtp);
router.post('/:id/return', validate({ params: bookingIdParamsSchema }), DeliveryController.initiateReturn);
router.post('/:id/return/confirm', validate({ params: bookingIdParamsSchema }), DeliveryController.confirmReturn);
router.get('/:id/timeline', validate({ params: bookingIdParamsSchema }), DeliveryController.getTimeline);

export default router;
