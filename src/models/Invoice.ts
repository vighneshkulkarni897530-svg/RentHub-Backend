import mongoose, { Schema, Document, Types } from 'mongoose';

export type InvoiceStatus = 'generated' | 'sent' | 'paid' | 'void';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  invoiceNumber: string;
  booking: Types.ObjectId;
  payment: Types.ObjectId;
  user: Types.ObjectId;
  owner: Types.ObjectId;
  items: IInvoiceItem[];
  subtotal: number;
  platformFee: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  pdfUrl?: string;
  issuedAt: Date;
  dueAt?: Date;
  metadata: Record<string, unknown>;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, unique: true, required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['generated', 'sent', 'paid', 'void'], default: 'generated' },
    pdfUrl: { type: String, default: '' },
    issuedAt: { type: Date, default: Date.now },
    dueAt: { type: Date },
    metadata: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ owner: 1, createdAt: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
export default Invoice;
