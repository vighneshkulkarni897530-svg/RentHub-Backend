import { Response } from 'express';
import NotificationPreferenceService from '../services/notificationPreferences.service';
import PushSubscriptionRepository from '../repositories/PushSubscriptionRepository';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class NotificationPreferenceController {
  getPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
    const preferences = await NotificationPreferenceService.getPreferences(req.user!.id);
    res.status(200).json(ApiResponse.ok(preferences));
  });

  updatePreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
    const preferences = await NotificationPreferenceService.updatePreferences(req.user!.id, req.body.categories);
    res.status(200).json(ApiResponse.ok(preferences, 'Preferences updated'));
  });

  pushSubscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const sub = req.body.subscription || {
      endpoint: req.body.p256dh ? `manual_${Date.now()}` : '',
      keys: { p256dh: req.body.p256dh || '', auth: req.body.auth || '' },
    };
    await PushSubscriptionRepository.upsert(req.user!.id, sub);
    res.status(200).json(ApiResponse.ok(null, 'Push subscription saved'));
  });

  pushUnsubscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
    await PushSubscriptionRepository.remove(req.body.endpoint);
    res.status(200).json(ApiResponse.ok(null, 'Push subscription removed'));
  });
}

export default new NotificationPreferenceController();
