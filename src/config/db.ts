import mongoose from 'mongoose';
import env from './env';
import logger from './logger';

/**
 * Connects to MongoDB (Atlas or local) via Mongoose.
 */
export async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(env.mongodbUri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${(error as Error).message}`);
    throw error;
  }
}

export default connectDB;

