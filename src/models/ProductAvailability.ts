import mongoose, { Schema, Document, Types } from 'mongoose';

export type BlockReason = 'maintenance' | 'blocked' | 'unavailable';

export interface IProductAvailability extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  reason: BlockReason;
  startDate: Date;
  endDate: Date;
  note: string;
  createdBy: Types.ObjectId;
}

const productAvailabilitySchema = new Schema<IProductAvailability>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    reason: {
      type: String,
      enum: ['maintenance', 'blocked', 'unavailable'],
      default: 'blocked',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    note: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Index to speed up date-range conflict queries
productAvailabilitySchema.index({ product: 1, startDate: 1, endDate: 1 });

export const ProductAvailability = mongoose.model<IProductAvailability>(
  'ProductAvailability',
  productAvailabilitySchema
);
export default ProductAvailability;

