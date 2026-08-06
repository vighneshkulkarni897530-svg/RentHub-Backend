import { Router } from 'express';
import PayoutController from '../controllers/payout.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPayoutSchema, payoutIdParamsSchema, listPayoutsQuerySchema } from '../validators/payout';

const router = Router();

router.use(authenticate, authorize('owner', 'admin'));

router.get('/summary', PayoutController.getSettlementSummary);
router.get('/', validate({ query: listPayoutsQuerySchema }), PayoutController.getPayouts);
router.post('/', validate({ body: createPayoutSchema }), PayoutController.createPayout);
router.get('/:id', validate({ params: payoutIdParamsSchema }), PayoutController.getPayout);

export default router;
