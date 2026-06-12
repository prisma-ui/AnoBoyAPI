import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });

    redisClient.on('error', (err) => {
      logger.warn(`Redis error: ${err.message} — caching disabled`);
      redisClient = null;
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.connect().catch(() => {
      logger.warn('Redis connection failed — running without cache');
      redisClient = null;
    });
  } catch {
    logger.warn('Redis init failed — running without cache');
    redisClient = null;
  }

  return redisClient;
}
