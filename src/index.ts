import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import path from 'path';

import connectDB from './config/db';
import env from './config/env';
import logger from './config/logger';
import allRoutes from './routes';
import { initSocket } from './socket';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
// CORS: honour CLIENT_URL (comma-separated origins) from env so production
// origins (e.g. Vercel) can reach the API; local dev falls back to
// http://localhost:3000 via env.ts default.
app.use(cors({
    origin: env.clientUrl.split(',').map((s: string) => s.trim()),
    credentials: true,
}));
// helmet with custom Permissions-Policy so the AI Voice Assistant
// can use the browser Web Speech API (microphone) for voice input.
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    })
);
app.use((_req: Request, res: Response, next: () => void) => {
    res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(self), geolocation=(self), payment=(self "https://checkout.razorpay.com"), usb=(), battery=()'
    );
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(compression());

// Serve locally uploaded files (used when Cloudinary is not configured).
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP' });
});

// API Routes
app.use('/', allRoutes);

// 404 & centralized error handling (JSON envelope, no stack traces leaked)
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// Initialize Socket.IO for real-time chat + notifications (optional).
// If the socket server is unavailable, the REST API still works normally.
try {
    initSocket(server);
} catch (error) {
    logger.warn('Socket.IO initialization failed (optional feature):', error);
}

export default app;