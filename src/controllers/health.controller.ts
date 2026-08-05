import { Request, Response } from 'express';
import mongoose from 'mongoose';

/**
 * Health check endpoints for Docker/K8s/load-balancer probes.
 * - GET /api/v1/health       -> liveness + basic info (existing contract preserved)
 * - GET /api/v1/health/liveness  -> process alive
 * - GET /api/v1/health/readiness -> DB connection ready
 * - GET /api/v1/health/metrics   -> Prometheus-style numeric metrics
 */

/** Basic liveness: process is up and responding. */
export function liveness(_req: Request, res: Response) {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}

/** Readiness: DB connected, app ready to serve traffic. */
export function readiness(_req: Request, res: Response) {
  const dbState = mongoose.connection.readyState;
  const dbReady = dbState === 1; // 1 = connected
  if (!dbReady) {
    res.status(503).json({
      success: false,
      status: 'unavailable',
      db: 'disconnected',
      dbState,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  res.status(200).json({
    success: true,
    status: 'ready',
    db: 'connected',
    dbState,
    timestamp: new Date().toISOString(),
  });
}

/** Prometheus-style metrics for monitoring/alerting. */
export function metrics(_req: Request, res: Response) {
  const mem = process.memoryUsage();
  const dbState = mongoose.connection.readyState;
  const lines = [
    '# HELP nodejs_process_uptime_seconds Process uptime in seconds',
    '# TYPE nodejs_process_uptime_seconds gauge',
    `nodejs_process_uptime_seconds ${process.uptime()}`,
    '',
    '# HELP nodejs_memory_bytes Memory usage in bytes',
    '# TYPE nodejs_memory_bytes gauge',
    `nodejs_memory_heap_used_bytes ${mem.heapUsed}`,
    `nodejs_memory_heap_total_bytes ${mem.heapTotal}`,
    `nodejs_memory_rss_bytes ${mem.rss}`,
    `nodejs_memory_external_bytes ${mem.external}`,
    '',
    '# HELP nodejs_db_connection_state MongoDB connection state (1=connected)',
    '# TYPE nodejs_db_connection_state gauge',
    `nodejs_db_connection_state ${dbState}`,
    '',
    '# HELP renthub_api_version API version',
    '# TYPE renthub_api_version gauge',
    `renthub_api_version 1`,
  ];
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(lines.join('\n'));
}

export default { liveness, readiness, metrics };
