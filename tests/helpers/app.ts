import request from 'supertest';
import app from '../../src/app';

/**
 * Returns a supertest instance bound to the Express app.
 */
export function getApp() {
  return request(app);
}

/**
 * Builds an Authorization header with a Bearer token.
 */
export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export default getApp;
