import { Router } from 'express';
import NotificationPreferenceController from '../controllers/notificationPreference.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateNotificationPreferencesSchema, pushSubscribeSchema, pushUnsubscribeSchema } from '../validators/notificationPreference';

const router = Router();

router.use(authenticate);

router.get('/', NotificationPreferenceController.getPreferences);
router.put('/', validate({ body: updateNotificationPreferencesSchema }), NotificationPreferenceController.updatePreferences);
router.post('/push-subscribe', validate({ body: pushSubscribeSchema }), NotificationPreferenceController.pushSubscribe);
router.post('/push-unsubscribe', validate({ body: pushUnsubscribeSchema }), NotificationPreferenceController.pushUnsubscribe);

export default router;
