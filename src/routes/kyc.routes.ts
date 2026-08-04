import { Router } from 'express';
import KycController from '../controllers/kyc.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitKycSchema, kycIdParamsSchema, reviewKycSchema } from '../validators/kyc';

const router = Router();

router.use(authenticate);

router.get('/', KycController.getVerificationStatus);
router.post('/', validate({ body: submitKycSchema }), KycController.submitVerification);

router.use(authorize('admin'));
router.get('/all', KycController.listVerifications);
router.put('/:id/review', validate({ params: kycIdParamsSchema, body: reviewKycSchema }), KycController.reviewVerification);

export default router;
