import { Router, raw } from 'express';
import PaymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPaymentOrderSchema, verifyPaymentSchema } from '../validators/payment';

const router = Router();

// Public Razorpay webhook (must be registered before authenticate middleware).
// Razorpay signs the raw request body, so it must NOT be parsed by express.json().
router.post('/webhook', raw({ type: 'application/json' }), PaymentController.webhook);

router.use(authenticate);

router.get('/', PaymentController.getPayments);
router.get('/earnings', PaymentController.getEarnings);
router.post('/create-order', validate({ body: createPaymentOrderSchema }), PaymentController.createOrder);
router.post('/verify', validate({ body: verifyPaymentSchema }), PaymentController.verifyPayment);

export default router;

