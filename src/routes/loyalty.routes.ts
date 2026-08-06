import { Router } from 'express';
import LoyaltyController from '../controllers/loyalty.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { redeemPointsSchema, applyReferralSchema } from '../validators/loyalty';

const router = Router();

router.use(authenticate);

router.get('/', LoyaltyController.getAccount);
router.get('/transactions', LoyaltyController.getTransactions);
router.get('/referral', LoyaltyController.getOrCreateReferral);
router.post('/referral/apply', validate({ body: applyReferralSchema }), LoyaltyController.applyReferral);
router.post('/redeem', validate({ body: redeemPointsSchema }), LoyaltyController.redeemPoints);

export default router;
