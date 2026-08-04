import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProductImage extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  url: string;
  publicId: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
}

const productImageSchema = new Schema<IProductImage>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    altText: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ProductImage = mongoose.model<IProductImage>('ProductImage', productImageSchema);
export default ProductImage;

