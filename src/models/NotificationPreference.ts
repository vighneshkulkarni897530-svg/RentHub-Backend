import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';
export type NotificationCategory =
  | 'booking'
  | 'payment'
  | 'delivery'
  | 'marketing'
  | 'system'
  | 'review';

export interface IChannelSetting {
  channel: NotificationChannel;
  enabled: boolean;
}

export interface INotificationPreference extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  categories: Record<string, IChannelSetting[]>;
  updatedAt: Date;
}

const channelSettingSchema = new Schema<IChannelSetting>(
  {
    channel: { type: String, enum: ['push', 'email', 'sms', 'in_app'], required: true },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    categories: {
      type: Schema.Types.Mixed,
      default: () => ({
        booking: allChannels(),
        payment: allChannels(),
        delivery: allChannels(),
        marketing: allChannels(),
        system: allChannels(),
        review: allChannels(),
      }),
    },
  },
  { timestamps: true }
);

function allChannels(): IChannelSetting[] {
  return [
    { channel: 'push', enabled: true },
    { channel: 'email', enabled: true },
    { channel: 'sms', enabled: true },
    { channel: 'in_app', enabled: true },
  ];
}

export const NotificationPreference = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  notificationPreferenceSchema
);
export default NotificationPreference;
