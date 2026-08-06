import { Router } from 'express';
import RefundController from '../controllers/refund.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createRefundSchema, refundIdParamsSchema, listRefundsQuerySchema } from '../validators/refund';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listRefundsQuerySchema }), RefundController.getRefunds);
router.post('/', authorize('admin', 'owner'), validate({ body: createRefundSchema }), RefundController.initiateRefund);
router.get('/:id', validate({ params: refundIdParamsSchema }), RefundController.getRefund);

export default router;
