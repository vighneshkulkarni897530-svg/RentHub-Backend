import mongoose, { Schema, Document, Types } from 'mongoose';

export type InsightType =
  | 'owner_revenue_forecast'
  | 'owner_booking_prediction'
  | 'owner_demand_trend'
  | 'owner_peak_season'
  | 'owner_inventory_utilization'
  | 'owner_best_category'
  | 'admin_revenue_prediction'
  | 'admin_growth_forecast'
  | 'admin_popular_category'
  | 'admin_profitable_city'
  | 'admin_user_behavior'
  | 'price_suggestion'
  | 'description_draft'
  | 'image_analysis';

export interface IAIInsight extends Document {
  _id: Types.ObjectId;
  type: InsightType;
  scope: 'user' | 'owner' | 'admin' | 'product' | 'global';
  ownerId?: Types.ObjectId;
  productId?: Types.ObjectId;
  userId?: Types.ObjectId;
  data: Record<string, unknown>;
  confidence: number;
  expiresAt: Date;
  createdAt: Date;
}

const aiInsightSchema = new Schema<IAIInsight>(
  {
    type: { type: String, required: true, index: true },
    scope: { type: String, enum: ['user', 'owner', 'admin', 'product', 'global'], default: 'global' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    data: { type: Schema.Types.Mixed, default: () => ({}) },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

aiInsightSchema.index({ type: 1, scope: 1, ownerId: 1, productId: 1 });
aiInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AIInsight = mongoose.model<IAIInsight>('AIInsight', aiInsightSchema);
export default AIInsight;
