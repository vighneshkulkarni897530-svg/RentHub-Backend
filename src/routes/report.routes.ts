import { Router } from 'express';
import ReportController from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReportSchema, updateReportStatusSchema, reportIdParamsSchema } from '../validators/report';

const router = Router();

router.use(authenticate);

router.get('/my', ReportController.getMyReports);
router.post('/', validate({ body: createReportSchema }), ReportController.createReport);
router.put(
  '/:id/status',
  authorize('admin'),
  validate({ params: reportIdParamsSchema, body: updateReportStatusSchema }),
  ReportController.updateReportStatus
);

export default router;

