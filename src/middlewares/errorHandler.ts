import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });

  if (res.headersSent) return;

  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  sendError(res, message, 500);
}

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 'Route not found', 404);
}
