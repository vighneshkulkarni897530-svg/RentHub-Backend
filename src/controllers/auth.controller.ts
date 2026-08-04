import { Response } from 'express';
import AuthService from '../services/auth.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.register(req.body);
    res.status(201).json(ApiResponse.ok(result, 'Registration successful. Please verify your email.'));
  });

  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.login(req.body);
    res.status(200).json(ApiResponse.ok(result, 'Login successful'));
  });

  refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshTokens(refreshToken);
    res.status(200).json(ApiResponse.ok(result, 'Tokens refreshed'));
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) await AuthService.logout(refreshToken);
    res.status(200).json(ApiResponse.ok(null, 'Logged out successfully'));
  });

  logoutAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    await AuthService.logoutAll(req.user!.id);
    res.status(200).json(ApiResponse.ok(null, 'Logged out of all devices'));
  });

  forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    await AuthService.forgotPassword(req.body.email);
    res.status(200).json(ApiResponse.ok(null, 'If an account exists with this email, you will receive a password reset link.'));
  });

  resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    await AuthService.resetPassword(req.body.token, req.body.password);
    res.status(200).json(ApiResponse.ok(null, 'Password reset successful. You can now log in.'));
  });

  verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
    await AuthService.verifyEmail(req.body.token);
    res.status(200).json(ApiResponse.ok(null, 'Email verified successfully! You can now log in.'));
  });

  resendVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
    await AuthService.resendVerification(req.body.email);
    res.status(200).json(ApiResponse.ok(null, 'A new verification link has been sent to your email.'));
  });

  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    await AuthService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    res.status(200).json(ApiResponse.ok(null, 'Password changed successfully'));
  });

  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await AuthService.getProfile(req.user!.id);
    res.status(200).json(ApiResponse.ok(user));
  });
}

export default new AuthController();

