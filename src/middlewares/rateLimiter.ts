import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { sendError } from '../utils/response';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests, please try again later.', 429);
  },
  skip: (req) => req.path === '/health',
});
