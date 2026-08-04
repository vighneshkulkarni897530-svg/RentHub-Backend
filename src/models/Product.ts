import mongoose, { Schema, Document, Types } from 'mongoose';

export type PriceUnit = 'hour' | 'day' | 'week' | 'month';
export type ModerationStatus = 'approved' | 'pending' | 'rejected';
export type ListingStatus = 'active' | 'inactive' | 'draft';

export interface IProduct extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  category: Types.ObjectId;
  owner: Types.ObjectId;
  images: string[];
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'used';
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    coordinates: { lat: number; lng: number };
  };
  rentalPrice: number;
  priceUnit: PriceUnit;
  securityDeposit: number;
  features: string[];
  tags: string[];
  moderationStatus: ModerationStatus;
  listingStatus: ListingStatus;
  isFeatured: boolean;
  isTrending: boolean;
  rating: number;
  reviewCount: number;
  bookingsCount: number;
  totalRevenue: number;
  deliveryOptions: string[];
  cancellationPolicy: string;
}

const productLocationSchema = new Schema(
  {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    images: [{ type: String }],
    condition: {
      type: String,
      enum: ['new', 'like_new', 'good', 'fair', 'used'],
      default: 'good',
    },
    location: { type: productLocationSchema, default: () => ({}) },
    rentalPrice: { type: Number, required: true, min: 0 },
    priceUnit: { type: String, enum: ['hour', 'day', 'week', 'month'], default: 'day' },
    securityDeposit: { type: Number, default: 0, min: 0 },
    features: [{ type: String }],
    tags: [{ type: String }],
    moderationStatus: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'pending',
    },
    listingStatus: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active',
    },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    bookingsCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    deliveryOptions: [{ type: String, enum: ['pickup', 'delivery', 'both'] }],
    cancellationPolicy: { type: String, default: 'flexible' },
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, listingStatus: 1, moderationStatus: 1 });
productSchema.index({ owner: 1, listingStatus: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
export default Product;

