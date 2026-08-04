import mongoose, { Schema, Document, Types } from 'mongoose';

export type PaymentStatusType = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethodType = 'card' | 'upi' | 'netbanking' | 'wallet' | 'razorpay';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  user: Types.ObjectId;
  owner: Types.ObjectId;
  transactionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: PaymentStatusType;
  method: PaymentMethodType;
  currency: string;
  metadata: Record<string, unknown>;
  completedAt?: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transactionId: { type: String, unique: true, sparse: true },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    method: { type: String, enum: ['card', 'upi', 'netbanking', 'wallet', 'razorpay'], default: 'razorpay' },
    currency: { type: String, default: 'INR' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;

