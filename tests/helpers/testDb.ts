import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo: MongoMemoryServer | null = null;

/**
 * Connects to an in-memory MongoDB instance for integration tests.
 */
export async function connectTestDb(): Promise<void> {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
}

/**
 * Disconnects and stops the in-memory MongoDB instance.
 */
export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
    mongo = null;
  }
}

/**
 * Clears all collections between tests.
 */
export async function clearTestDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Creates a valid MongoDB ObjectId string.
 */
export function objectId(): string {
  return new mongoose.Types.ObjectId().toString();
}

export default {
  connectTestDb,
  disconnectTestDb,
  clearTestDb,
  objectId,
};
