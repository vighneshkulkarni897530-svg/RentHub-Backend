import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPushSubscription extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
  userAgent?: string;
  createdAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, default: '' },
      auth: { type: String, default: '' },
    },
    expirationTime: { type: Number, default: null },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ user: 1 });

export const PushSubscription = mongoose.model<IPushSubscription>(
  'PushSubscription',
  pushSubscriptionSchema
);
export default PushSubscription;
