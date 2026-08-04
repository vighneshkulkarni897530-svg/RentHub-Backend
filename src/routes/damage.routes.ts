import { Router } from 'express';
import DamageController from '../controllers/damage.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createDamageReportSchema, updateDamageReportSchema, damageReportIdParamsSchema } from '../validators/damage';

const router = Router();

router.use(authenticate);
router.post('/', validate({ body: createDamageReportSchema }), DamageController.createDamageReport);
router.get('/my', DamageController.getMyReports);
router.get('/booking/:id', validate({ params: damageReportIdParamsSchema }), DamageController.getBookingReports);
router.put('/:id', authorize('admin', 'owner'), validate({ params: damageReportIdParamsSchema, body: updateDamageReportSchema }), DamageController.updateDamageReport);

export default router;
