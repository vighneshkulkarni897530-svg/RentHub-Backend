import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';

import connectDB from './config/db';
import logger from './config/logger';
import allRoutes from './routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(compression());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP' });
});

// API Routes
app.use('/', allRoutes);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

export default app;