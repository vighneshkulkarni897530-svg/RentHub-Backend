import mongoose, { Schema, Document, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'declined';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type DeliveryOption = 'pickup' | 'delivery';
export type DeliveryStatus = 'pending' | 'pickup_ready' | 'out_for_delivery' | 'delivered' | 'return_pickup' | 'returned' | 'cancelled';
export type FulfillmentMethod = 'delivery' | 'pickup';

export interface IDeliveryAddress {
  fullName: string;
  mobile: string;
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  instructions?: string;
}

export interface IPickupLocation {
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  instructions?: string;
  contactNumber?: string;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  renter: Types.ObjectId;
  owner: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  duration: number;
  durationUnit: string;
  totalPrice: number;
  securityDeposit: number;
  deliveryFee: number;
  platformFee: number;
  couponCode?: string;
  couponDiscount: number;
  couponType: 'fixed' | 'percentage';
  grandTotal: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  deliveryOption: DeliveryOption;
  fulfillmentMethod: FulfillmentMethod;
  deliveryAddress?: IDeliveryAddress;
  pickupLocation?: IPickupLocation;
  deliveryAddressString?: string;
  deliveryStatus: DeliveryStatus;
  deliveryPartner?: string;
  deliveryOtp?: string;
  estimatedArrival?: Date;
  trackingTimeline: Array<{ status: DeliveryStatus; note: string; timestamp: Date }>;
  notes?: string;
  cancellationReason?: string;
  createdAt: Date;
}

const deliveryAddressSchema = new Schema(
  {
    fullName: { type: String, default: '' },
    mobile: { type: String, default: '' },
    address: { type: String, default: '' },
    area: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    landmark: { type: String, default: '' },
    instructions: { type: String, default: '' },
  },
  { _id: false }
);

const pickupLocationSchema = new Schema(
  {
    address: { type: String, default: '' },
    area: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    landmark: { type: String, default: '' },
    instructions: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBooking>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    renter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    duration: { type: Number, required: true, min: 1 },
    durationUnit: { type: String, enum: ['hour', 'day', 'week', 'month'], default: 'day' },
    totalPrice: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    couponType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    grandTotal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'declined'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
    },
    deliveryOption: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    fulfillmentMethod: { type: String, enum: ['delivery', 'pickup'], default: 'pickup' },
    deliveryAddress: { type: deliveryAddressSchema, default: () => ({}) },
    pickupLocation: { type: pickupLocationSchema, default: () => ({}) },
    deliveryAddressString: { type: String },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'pickup_ready', 'out_for_delivery', 'delivered', 'return_pickup', 'returned', 'cancelled'],
      default: 'pending',
    },
    deliveryPartner: { type: String },
    deliveryOtp: { type: String },
    estimatedArrival: { type: Date },
    trackingTimeline: {
      type: [
        {
          status: { type: String, enum: ['pending', 'pickup_ready', 'out_for_delivery', 'delivered', 'return_pickup', 'returned', 'cancelled'], required: true },
          note: { type: String, default: '' },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    notes: { type: String, maxlength: 500 },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

// Prevent double-booking for overlapping date ranges on the same product
bookingSchema.index({ product: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ renter: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;