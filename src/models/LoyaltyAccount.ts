import mongoose, { Schema, Document, Types } from 'mongoose';

export type MembershipLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ILoyaltyTransaction {
  type: 'earn' | 'redeem' | 'expire' | 'referral' | 'adjustment';
  points: number;
  description: string;
  reference?: string;
  createdAt: Date;
}

export interface ILoyaltyAccount extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  points: number;
  lifetimePoints: number;
  level: MembershipLevel;
  transactions: ILoyaltyTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    type: { type: String, enum: ['earn', 'redeem', 'expire', 'referral', 'adjustment'], required: true },
    points: { type: Number, required: true },
    description: { type: String, default: '' },
    reference: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const loyaltyAccountSchema = new Schema<ILoyaltyAccount>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    points: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    level: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
    transactions: { type: [loyaltyTransactionSchema], default: [] },
  },
  { timestamps: true }
);

export const LoyaltyAccount = mongoose.model<ILoyaltyAccount>('LoyaltyAccount', loyaltyAccountSchema);
export default LoyaltyAccount;
