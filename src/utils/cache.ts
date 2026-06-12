import { getRedisClient } from '../config/redis';
import { logger } from './logger';

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    logger.debug(`Cache get error for key ${key}:`, err);
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.debug(`Cache set error for key ${key}:`, err);
  }
}

export async function deleteCache(pattern: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (err) {
    logger.debug(`Cache delete error for pattern ${pattern}:`, err);
  }
}
