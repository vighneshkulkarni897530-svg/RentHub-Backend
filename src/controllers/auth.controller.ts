import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/user.model';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import AuthService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['customer', 'owner']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Build a public user object (never includes the password).
 */
function toPublicUser(user: any) {
  return {
    id: user._id?.toString() || user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    phone: user.phone || '',
    role: user.role,
    status: user.status,
    verified: user.verified,
    isEmailVerified: user.isEmailVerified,
    kycStatus: user.kycStatus,
    wallet: user.wallet || {
      balance: 0,
      refundBalance: 0,
      credit: 0,
      rewardPoints: 0,
      transactions: [],
    },
    location: user.location,
    rating: user.rating,
    totalRentals: user.totalRentals,
    totalListings: user.totalListings,
    storeName: user.storeName,
    storeDescription: user.storeDescription,
    createdAt: user.createdAt,
  };
}

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role: role || 'customer' });

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      accessToken,
      refreshToken,
      user: toPublicUser(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: toPublicUser(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({
    success: true,
    data: toPublicUser(user),
  });
};

// ------------------------------------------------------------------
// Additional auth flows (delegated to AuthService)
// ------------------------------------------------------------------

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }
  } catch {
    // Logout is best-effort — always return success so the client clears state.
  }
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(error?.statusCode || 500).json({ success: false, message: error?.message || 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    await AuthService.forgotPassword(email);
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error: any) {
    res.status(error?.statusCode || 500).json({ success: false, message: error?.message || 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body || {};
    await AuthService.resetPassword(token, password);
    res.status(200).json({ success: true, message: 'Your password has been reset successfully' });
  } catch (error: any) {
    res.status(error?.statusCode || 500).json({ success: false, message: error?.message || 'Server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    await AuthService.verifyEmail(req.params.token);
    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error: any) {
    res.status(error?.statusCode || 500).json({ success: false, message: error?.message || 'Server error' });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    await AuthService.resendVerification(email);
    res.status(200).json({ success: true, message: 'A new verification link has been sent to your email.' });
  } catch (error: any) {
    res.status(error?.statusCode || 500).json({ success: false, message: error?.message || 'Server error' });
  }
};