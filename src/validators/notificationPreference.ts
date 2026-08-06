import { z } from 'zod';

const channelSettingSchema = z.object({
  channel: z.enum(['push', 'email', 'sms', 'in_app']),
  enabled: z.boolean().default(true),
});

export const updateNotificationPreferencesSchema = z.object({
  categories: z.object({
    booking: z.array(channelSettingSchema).optional(),
    payment: z.array(channelSettingSchema).optional(),
    delivery: z.array(channelSettingSchema).optional(),
    marketing: z.array(channelSettingSchema).optional(),
    system: z.array(channelSettingSchema).optional(),
    review: z.array(channelSettingSchema).optional(),
  }),
});

export const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().min(1),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  keys: z.object({ p256dh: z.string(), auth: z.string() }).optional(),
  p256dh: z.string().optional(),
  auth: z.string().optional(),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().min(1),
});

export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;
export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;
