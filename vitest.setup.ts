// Set test environment variables before importing app modules that read env
(process.env as Record<string, string | undefined>).NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.API_VERSION = 'v1';

// Mock dotenv to avoid CJS/ESM interop issues in vitest 4.
// config() reads from process.env (already set above) and is a no-op.
vi.mock('dotenv', () => ({
  default: { config: vi.fn(() => ({ parsed: {} })) },
  config: vi.fn(() => ({ parsed: {} })),
}));

// Silence winston logger in tests
vi.mock('./src/config/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Silence socket.io module (getIO returns null in tests unless initialized)
vi.mock('./src/socket', () => ({
  default: { initSocket: vi.fn(), getIO: vi.fn(() => null) },
  initSocket: vi.fn(),
  getIO: vi.fn(() => null),
}));

// Silence email service (smtp not configured in tests)
vi.mock('./src/services/email.service', () => ({
  default: {
    sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendBookingConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  },
}));
