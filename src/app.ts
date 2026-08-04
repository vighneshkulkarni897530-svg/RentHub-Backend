import express, { Application, Request, Response } from 'express';
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

const app: Application = express();

// --- Security & middleware ---
app.use(helmet());
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

// --- Logging ---
if (env.nodeEnv !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
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

export default app;

