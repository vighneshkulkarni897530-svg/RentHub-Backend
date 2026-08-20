import mongoose, { Schema, Document, Types } from 'mongoose';

export type PurchaseStatus = 'confirmed' | 'pending' | 'cancelled';
export type PurchaseDeliveryStatus = 'pending' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface IPurchase extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  buyer: Types.ObjectId;
  owner: Types.ObjectId;
  rentalId: Types.ObjectId | null;
  purchaseRequestId: Types.ObjectId | null;
  price: number;
  status: PurchaseStatus;
  deliveryStatus: PurchaseDeliveryStatus;
  deliveryOption: string;
  deliveryAddress?: string;
  deliveryFee: number;
  platformFee: number;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rentalId: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
    purchaseRequestId: { type: Schema.Types.ObjectId, ref: 'PurchaseRequest', default: null },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'cancelled'],
      default: 'pending',
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryOption: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    deliveryAddress: { type: String },
    deliveryFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

purchaseSchema.index({ buyer: 1, status: 1, createdAt: -1 });
purchaseSchema.index({ owner: 1, status: 1, createdAt: -1 });

export const Purchase = mongoose.model<IPurchase>('Purchase', purchaseSchema);
export default Purchase;