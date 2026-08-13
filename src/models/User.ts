import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'customer' | 'owner' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    coordinates: { lat: number; lng: number };
  };
  verified: boolean;
  isEmailVerified: boolean;
  rating: number;
  totalRentals: number;
  totalListings: number;
  storeName?: string;
  storeDescription?: string;
  documents?: string[];
  kycStatus: 'pending' | 'verified' | 'rejected';
  wallet: {
    balance: number;
    refundBalance: number;
    credit: number;
    rewardPoints: number;
    transactions: Array<{
      type: 'payment' | 'refund' | 'cashback' | 'reward' | 'withdrawal' | 'system';
      amount: number;
      status: 'pending' | 'completed' | 'refunded' | 'failed';
      description: string;
      reference?: string;
      createdAt: Date;
    }>;
  };
  lastActive: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {
  isEmailTaken(email: string, excludeId?: string): Promise<boolean>;
}

const locationSchema = new Schema(
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

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    avatar: {
      type: String,
      default: '',
      set: (v: string) =>
        v || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'owner', 'admin'], default: 'customer' },
    status: { type: String, enum: ['active', 'inactive', 'suspended', 'pending'], default: 'active' },
    location: { type: locationSchema, default: () => ({}) },
    verified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRentals: { type: Number, default: 0 },
    totalListings: { type: Number, default: 0 },
    storeName: { type: String, default: '' },
    storeDescription: { type: String, default: '' },
    documents: [{ type: String }],
    kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    wallet: {
      balance: { type: Number, default: 0 },
      refundBalance: { type: Number, default: 0 },
      credit: { type: Number, default: 0 },
      rewardPoints: { type: Number, default: 0 },
      transactions: [
        {
          type: {
            type: String,
            enum: ['payment', 'refund', 'cashback', 'reward', 'withdrawal', 'system'],
            required: true,
          },
          amount: { type: Number, required: true },
          status: { type: String, enum: ['pending', 'completed', 'refunded', 'failed'], default: 'completed' },
          description: { type: String, default: '' },
          reference: { type: String, default: '' },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    lastActive: { type: Date, default: Date.now },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Static: check if email is already taken
userSchema.statics.isEmailTaken = async function (
  this: Model<IUser>,
  email: string,
  excludeId?: string
): Promise<boolean> {
  const query: Record<string, unknown> = { email: email.toLowerCase() };
  if (excludeId) query._id = { $ne: excludeId };
  const user = await this.findOne(query).select('_id');
  return Boolean(user);
};

const User =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUser, IUserModel>('User', userSchema);

export { User };
export default User;

