import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env';
import logger from './config/logger';
import routes from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { requestId, mongoSanitize } from './middleware/security';
import { requestTiming } from './middleware/requestLogger';
import * as Sentry from '@sentry/node';

const app: Application = express();

// --- Trust proxy (for correct req.ip behind nginx/load balancer) ---
app.set('trust proxy', Number(env.nodeEnv === 'production' ? 1 : 0) || false);

// --- Request ID (correlation ID for logs) ---
app.use(requestId);

// --- Security & middleware ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://checkout.razorpay.com', 'https://js.stripe.com'],
        // Next.js inline scripts + fonts from Google Fonts
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
        objectSrc: ["'none'"],
        frameSrc: ["'self'", 'https://checkout.razorpay.com'],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Permissions policy (hardening)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(self "https://checkout.razorpay.com"), usb=(), battery=()'
  );
  next();
});

app.use(
  cors({
    origin: env.clientUrl.split(',').map((s: string) => s.trim()),
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// --- MongoDB injection protection ---
app.use(mongoSanitize());

// --- Logging ---
if (env.nodeEnv !== 'test') {
  app.use(requestTiming);
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// --- Rate limiting ---
app.use('/api', apiLimiter);

// --- Root ---
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to RentHub API',
    docs: '/api/v1/health',
    version: '1.0.0',
  });
});

// --- API Routes (versioned) ---
app.use(`/api/${env.apiVersion}`, routes);

// --- 404 & error handling ---
app.use(notFound);
app.use(errorHandler);

// --- Sentry error handler (must be registered after routes/error handlers) ---
if (env.sentryDsn) {
  Sentry.setupExpressErrorHandler(app);
}

export default app;
