import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  icon: string;
  image: string;
  description: string;
  subcategories: string[];
  status: 'active' | 'inactive';
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    icon: { type: String, default: 'Folder' },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    subcategories: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>('Category', categorySchema);
export default Category;

