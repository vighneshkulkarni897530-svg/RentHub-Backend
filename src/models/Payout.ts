import mongoose, { Schema, Document, Types } from 'mongoose';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PayoutMethod = 'bank' | 'upi' | 'wallet';

export interface IPayout extends Document {
  _id: Types.ObjectId;
  payoutId: string;
  owner: Types.ObjectId;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: PayoutStatus;
  method: PayoutMethod;
  accountDetails: Record<string, unknown>;
  periodStart?: Date;
  periodEnd?: Date;
  processedAt?: Date;
  failureReason?: string;
  reference?: string;
  metadata: Record<string, unknown>;
}

const payoutSchema = new Schema<IPayout>(
  {
    payoutId: { type: String, unique: true, required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    method: { type: String, enum: ['bank', 'upi', 'wallet'], default: 'bank' },
    accountDetails: { type: Schema.Types.Mixed, default: () => ({}) },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    processedAt: { type: Date },
    failureReason: { type: String, default: '' },
    reference: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

payoutSchema.index({ owner: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });

export const Payout = mongoose.model<IPayout>('Payout', payoutSchema);
export default Payout;
