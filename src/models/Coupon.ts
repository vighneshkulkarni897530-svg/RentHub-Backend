import mongoose, { Schema, Document, Types } from 'mongoose';

export type CouponType = 'fixed' | 'percentage';
export type CouponOwner = 'admin' | 'owner' | 'referral';

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  description?: string;
  couponType: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  ownerId?: Types.ObjectId;
  categoryIds: Types.ObjectId[];
  productIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, uppercase: true, unique: true, trim: true, index: true },
    description: { type: String, default: '' },
    couponType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
export default Coupon;
