import redis from '@adonisjs/redis/services/main'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

let redisAvailable: boolean | null = null

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (redisAvailable !== null) {
    return redisAvailable
  }

  if (!env.get('REDIS_ENABLED')) {
    redisAvailable = false
    return false
  }

  try {
    const connection = redis.connection()
    await connection.ping()
    redisAvailable = true
    logger.info('Redis connection successful')
    return true
  } catch (error) {
    redisAvailable = false
    logger.warn('Redis connection failed, using fallback', { error })
    return false
  }
}

/**
 * Get Redis connection (only if available)
 */
export async function getRedisConnection() {
  const available = await isRedisAvailable()
  if (!available) {
    throw new Error('Redis is not available')
  }
  return redis.connection()
}

/**
 * Reset Redis availability check (useful for tests)
 */
export function resetRedisCheck() {
  redisAvailable = null
}
