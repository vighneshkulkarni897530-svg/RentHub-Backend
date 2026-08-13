// Legacy compatibility module.
// The canonical `User` model lives in `./User` and is registered exactly once.
// This file exists only so existing imports of `./models/user.model` continue
// to resolve to the same model without registering a duplicate `User` model
// (which caused: OverwriteModelError: Cannot overwrite `User` model once compiled).
//
// The legacy `IUser` interface is preserved here (rather than re-exporting the
// canonical one) so that existing consumers such as `auth.controller.ts` and
// `auth.middleware.ts` keep their original type contract (optional `password`,
// no explicit `_id`) and continue to compile unchanged.
import { Document } from 'mongoose';
import User from './User';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'owner' | 'admin';
  comparePassword(password: string): Promise<boolean>;
}

export default User;