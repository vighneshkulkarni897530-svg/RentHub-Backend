import mongoose from 'mongoose';
import dns from 'node:dns';
import logger from './logger';

// Configure Node.js DNS servers before any MongoDB connection attempt.
// This resolves the `querySrv ECONNREFUSED` error seen with MongoDB Atlas
// when the system's default DNS configuration is not usable by Node.js.
dns.setServers(['8.8.8.8', '1.1.1.1']);
logger.info('DNS resolver configured');

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