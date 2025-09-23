import type { NextFunction, Request, Response } from 'express';
import { logger } from './logger.js';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not Found' });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  if (status >= 500) logger.error({ err }, 'Unhandled error');
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    details: err.details
  });
}
