import sendEmail from '../utils/email';

const FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:3000';

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendEmail(
    to,
    'Welcome to RentHub!',
    `<h2>Hi ${name},</h2><p>Welcome to RentHub! Your account has been created successfully.</p>`
  );
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/auth/verify-email?token=${token}`;
  await sendEmail(
    to,
    'Verify your RentHub email',
    `<h2>Hi ${name},</h2><p>Click the link below to verify your email address:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`
  );
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/auth/reset-password?token=${token}`;
  await sendEmail(
    to,
    'Reset your RentHub password',
    `<h2>Hi ${name},</h2><p>Click the link below to reset your password:</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`
  );
}

export async function sendBookingConfirmationEmail(to: string, name: string, bookingDetails: Record<string, unknown>): Promise<void> {
  await sendEmail(
    to,
    'Booking Confirmed - RentHub',
    `<h2>Hi ${name},</h2><p>Your booking has been confirmed!</p><pre>${JSON.stringify(bookingDetails, null, 2)}</pre>`
  );
}

export default {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
};

