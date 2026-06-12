import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'https://anoboy.be',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  scraper: {
    timeout: parseInt(process.env.REQUEST_TIMEOUT || '15000', 10),
    retries: parseInt(process.env.REQUEST_RETRIES || '3', 10),
    queueConcurrency: parseInt(process.env.REQUEST_QUEUE_CONCURRENCY || '5', 10),
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS || '*',
  },
  cache: {
    animeList: 600,
    animeDetail: 1800,
    episodeDetail: 1800,
    genres: 3600,
    studios: 3600,
    seasons: 3600,
  },
};
