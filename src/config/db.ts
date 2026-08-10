import mongoose from 'mongoose';
import logger from './logger';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  logger.error('MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected successfully.');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;