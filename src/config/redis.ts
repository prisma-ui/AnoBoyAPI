import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisUnavailable = false; // permanently disabled after first failure

export function getRedisClient(): Redis | null {
  if (redisUnavailable) return null;
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0,
      connectTimeout: 3000,
      // Disable auto-reconnect — if Redis is unavailable we run without cache
      retryStrategy: () => null,
      reconnectOnError: () => false,
    });

    redisClient.on('error', (err) => {
      logger.warn(`Redis error: ${err.message} — caching disabled`);
      redisClient?.disconnect();
      redisClient = null;
      redisUnavailable = true;
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
      redisUnavailable = false;
    });

    redisClient.connect().catch((err) => {
      logger.warn(`Redis connection failed — running without cache: ${err.message}`);
      redisClient = null;
      redisUnavailable = true;
    });
  } catch (err: any) {
    logger.warn(`Redis init failed — running without cache: ${err?.message}`);
    redisClient = null;
    redisUnavailable = true;
  }

  return redisClient;
}

export function resetRedis(): void {
  redisUnavailable = false;
  redisClient = null;
}
