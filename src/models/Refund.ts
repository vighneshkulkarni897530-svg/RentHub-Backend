import mongoose, { Schema, Document, Types } from 'mongoose';

export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type RefundMethod = 'original' | 'wallet' | 'bank';

export interface IRefund extends Document {
  _id: Types.ObjectId;
  refundId: string;
  booking: Types.ObjectId;
  payment: Types.ObjectId;
  user: Types.ObjectId;
  owner: Types.ObjectId;
  amount: number;
  razorpayRefundId?: string;
  status: RefundStatus;
  method: RefundMethod;
  reason: string;
  initiatedBy: Types.ObjectId;
  processedAt?: Date;
  failureReason?: string;
  metadata: Record<string, unknown>;
}

const refundSchema = new Schema<IRefund>(
  {
    refundId: { type: String, unique: true, required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    razorpayRefundId: { type: String },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    method: { type: String, enum: ['original', 'wallet', 'bank'], default: 'original' },
    reason: { type: String, default: '' },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    processedAt: { type: Date },
    failureReason: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

refundSchema.index({ user: 1, createdAt: -1 });
refundSchema.index({ booking: 1 });

export const Refund = mongoose.model<IRefund>('Refund', refundSchema);
export default Refund;
