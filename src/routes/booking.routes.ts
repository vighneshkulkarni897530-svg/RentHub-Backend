import { Router } from 'express';
import BookingController from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  updateBookingDeliverySchema,
  verifyDeliveryOtpSchema,
  bookingIdParamsSchema,
  listBookingsQuerySchema,
} from '../validators/booking';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listBookingsQuerySchema }), BookingController.getMyBookings);
router.post('/', validate({ body: createBookingSchema }), BookingController.createBooking);
router.get('/:id', validate({ params: bookingIdParamsSchema }), BookingController.getBookingById);
router.put(
  '/:id/status',
  validate({ params: bookingIdParamsSchema, body: updateBookingStatusSchema }),
  BookingController.updateBookingStatus
);
router.put(
  '/:id/delivery',
  validate({ params: bookingIdParamsSchema, body: updateBookingDeliverySchema }),
  BookingController.updateDeliveryStatus
);
router.post(
  '/:id/delivery/verify',
  validate({ params: bookingIdParamsSchema, body: verifyDeliveryOtpSchema }),
  BookingController.verifyDeliveryOtp
);
router.put(
  '/:id/cancel',
  validate({ params: bookingIdParamsSchema }),
  BookingController.cancelBooking
);

export default router;

