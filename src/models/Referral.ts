import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReferralStatus = 'pending' | 'rewarded' | 'expired';

export interface IReferral extends Document {
  _id: Types.ObjectId;
  code: string;
  referrer: Types.ObjectId;
  referredUser?: Types.ObjectId;
  rewardPoints: number;
  walletCredit: number;
  status: ReferralStatus;
  createdAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    // `unique: true` already creates an index — no need for `index: true` or a
    // separate `referralSchema.index({ code: 1 })` (avoids duplicate index warning).
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    referrer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referredUser: { type: Schema.Types.ObjectId, ref: 'User' },
    rewardPoints: { type: Number, default: 100 },
    walletCredit: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'rewarded', 'expired'], default: 'pending' },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1, status: 1 });

// Safe model reuse — prevents OverwriteModelError on hot reload.
export const Referral =
  (mongoose.models.Referral as mongoose.Model<IReferral>) ||
  mongoose.model<IReferral>('Referral', referralSchema);
export default Referral;