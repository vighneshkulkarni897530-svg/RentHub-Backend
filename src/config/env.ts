import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Centralized environment configuration with sensible defaults
 * so the server can start even when optional 3rd-party keys
 * (Cloudinary / Razorpay / SMTP / SMS / Push) are not yet configured.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  apiVersion: process.env.API_VERSION || 'v1',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/renthub',

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'RentHub <no-reply@renthub.com>',
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'msg91', // 'twilio' | 'msg91'
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      from: process.env.TWILIO_PHONE_NUMBER || '',
    },
    msg91: {
      authKey: process.env.MSG91_AUTH_KEY || '',
      senderId: process.env.MSG91_SENDER_ID || 'RENTHB',
      templateId: process.env.MSG91_TEMPLATE_ID || '',
    },
  },

  push: {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    vapidSubject: process.env.VAPID_SUBJECT || 'mailto:no-reply@renthub.com',
  },

  invoice: {
    companyName: process.env.INVOICE_COMPANY_NAME || 'RentHub',
    companyAddress: process.env.INVOICE_COMPANY_ADDRESS || '',
    companyGst: process.env.INVOICE_COMPANY_GST || '',
  },

  logLevel: process.env.LOG_LEVEL || 'info',

  sentryDsn: process.env.SENTRY_DSN || '',
  sentryTracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
} as const;

export default env;
