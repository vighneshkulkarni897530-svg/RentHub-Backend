import mongoose, { Schema, Document, Types } from 'mongoose';

export type FraudType =
  | 'fake_user'
  | 'spam_listing'
  | 'duplicate_product'
  | 'suspicious_booking'
  | 'fake_review'
  | 'multiple_accounts'
  | 'other';

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FraudStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface IFraudAlert extends Document {
  _id: Types.ObjectId;
  type: FraudType;
  severity: FraudSeverity;
  status: FraudStatus;
  riskScore: number;
  title: string;
  description: string;
  targetType: 'user' | 'product' | 'booking' | 'review' | 'other';
  targetId?: Types.ObjectId;
  actorId?: Types.ObjectId;
  evidence: Record<string, unknown>;
  suggestedAction: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
}

const fraudAlertSchema = new Schema<IFraudAlert>(
  {
    type: {
      type: String,
      enum: ['fake_user', 'spam_listing', 'duplicate_product', 'suspicious_booking', 'fake_review', 'multiple_accounts', 'other'],
      required: true,
      index: true,
    },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
    status: { type: String, enum: ['open', 'investigating', 'resolved', 'dismissed'], default: 'open', index: true },
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    targetType: { type: String, enum: ['user', 'product', 'booking', 'review', 'other'], default: 'other' },
    targetId: { type: Schema.Types.ObjectId, default: null },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    evidence: { type: Schema.Types.Mixed, default: () => ({}) },
    suggestedAction: { type: String, default: '' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

fraudAlertSchema.index({ status: 1, severity: 1, createdAt: -1 });
fraudAlertSchema.index({ type: 1, status: 1 });

export const FraudAlert = mongoose.model<IFraudAlert>('FraudAlert', fraudAlertSchema);
export default FraudAlert;
