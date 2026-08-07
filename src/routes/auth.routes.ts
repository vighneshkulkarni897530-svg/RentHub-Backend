import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changePasswordSchema,
} from '../validators/auth';

const router = Router();

// Apply stricter rate limiting to authentication endpoints to prevent brute-force.
router.use(authLimiter);

router.post('/register', validate({ body: registerSchema }), AuthController.register);
router.post('/login', validate({ body: loginSchema }), AuthController.login);
router.post('/refresh', validate({ body: refreshTokenSchema }), AuthController.refresh);
router.post('/logout', validate({ body: refreshTokenSchema }), AuthController.logout);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), AuthController.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), AuthController.resetPassword);
router.post('/verify-email', validate({ body: verifyEmailSchema }), AuthController.verifyEmail);
router.post('/resend-verification', validate({ body: resendVerificationSchema }), AuthController.resendVerification);

// Protected routes
router.use(authenticate);
router.post('/logout-all', AuthController.logoutAll);
router.post('/change-password', validate({ body: changePasswordSchema }), AuthController.changePassword);
router.get('/me', AuthController.getProfile);

export default router;

