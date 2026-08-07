import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType =
  | 'booking'
  | 'payment'
  | 'message'
  | 'review'
  | 'system'
  | 'admin'
  | 'promotion';

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  link?: string;
  metadata: Record<string, unknown>;
}

const notificationSchema = new Schema<INotification>(
{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['booking', 'payment', 'message', 'review', 'system', 'admin', 'promotion'],
      default: 'system',
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    link: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;

