import { Request, Response, NextFunction } from 'express';

/**
 * Request timing middleware.
 * Records request duration (ms) and stores it on the response local
 * for use in morgan logs and the /metrics endpoint.
 */
export function requestTiming(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime();
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = Math.round((seconds * 1000 + nanoseconds / 1e6) * 100) / 100;
    res.locals.responseTimeMs = durationMs;
  });
  next();
}

export default requestTiming;
