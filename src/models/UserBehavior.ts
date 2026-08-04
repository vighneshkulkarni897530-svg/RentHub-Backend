import mongoose, { Schema, Document, Types } from 'mongoose';

export type BehaviorType = 'view' | 'search' | 'wishlist' | 'booking' | 'category_view' | 'product_click';

export interface IUserBehavior extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: BehaviorType;
  product?: Types.ObjectId;
  category?: Types.ObjectId;
  query?: string;
  data?: Record<string, unknown>;
  weight: number;
  createdAt: Date;
}

const userBehaviorSchema = new Schema<IUserBehavior>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['view', 'search', 'wishlist', 'booking', 'category_view', 'product_click'],
      required: true,
      index: true,
    },
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    query: { type: String, default: '' },
    data: { type: Schema.Types.Mixed, default: () => ({}) },
    weight: { type: Number, default: 1 },
  },
  { timestamps: true }
);

userBehaviorSchema.index({ user: 1, type: 1, createdAt: -1 });
userBehaviorSchema.index({ product: 1, createdAt: -1 });

export const UserBehavior = mongoose.model<IUserBehavior>('UserBehavior', userBehaviorSchema);
export default UserBehavior;
