import mongoose, { Schema, Document, Types } from 'mongoose';

export type PurchaseRequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed' | 'cancelled';

export interface IPurchaseRequest extends Document {
  _id: Types.ObjectId;
  rentalId: Types.ObjectId | null;
  product: Types.ObjectId;
  renter: Types.ObjectId;
  owner: Types.ObjectId;
  offeredPrice: number;
  status: PurchaseRequestStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseRequestSchema = new Schema<IPurchaseRequest>(
  {
    rentalId: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    renter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    offeredPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired', 'completed', 'cancelled'],
      default: 'pending',
    },
    message: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

purchaseRequestSchema.index({ renter: 1, status: 1, createdAt: -1 });
purchaseRequestSchema.index({ owner: 1, status: 1, createdAt: -1 });
purchaseRequestSchema.index({ product: 1, status: 1 });

export const PurchaseRequest = mongoose.model<IPurchaseRequest>('PurchaseRequest', purchaseRequestSchema);
export default PurchaseRequest;