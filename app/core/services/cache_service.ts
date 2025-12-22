import { isRedisAvailable, getRedisConnection } from '#core/helpers/redis'
import logger from '@adonisjs/core/services/logger'

/**
 * In-memory cache fallback
 */
class MemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number | null }>()

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item) return null

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.value as T
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    this.cache.set(key, { value, expiresAt })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key)
    if (!item) return false

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  async flush(): Promise<void> {
    this.cache.clear()
  }

  async increment(key: string, value: number = 1): Promise<number> {
    const current = (await this.get<number>(key)) || 0
    const newValue = current + value
    await this.set(key, newValue)
    return newValue
  }

  async decrement(key: string, value: number = 1): Promise<number> {
    return this.increment(key, -value)
  }
}

/**
 * Cache service with automatic Redis → Memory fallback
 */
export default class CacheService {
  private memoryCache = new MemoryCache()
  private useRedis: boolean | null = null

  /**
   * Initialize cache (check Redis availability)
   */
  private async init() {
    if (this.useRedis === null) {
      this.useRedis = await isRedisAvailable()
      if (this.useRedis) {
        logger.info('CacheService: Using Redis')
      } else {
        logger.info('CacheService: Using Memory fallback')
      }
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    await this.init()

    if (this.useRedis) {
      try {
        const redis = await getRedisConnection()
        const value = await redis.get(key)
        return value ? JSON.parse(value) : null
      } catch (error) {
        logger.error('CacheService: Redis get error, using memory fallback', { error })
        this.useRedis = false
      }
    }

    return this.memoryCache.get<T>(key)
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    await this.init()

    if (this.useRedis) {
      try {
        const redis = await getRedisConnection()
        const serialized = JSON.stringify(value)
        if (ttlSeconds) {
          await redis.setex(key, ttlSeconds, serialized)
        } else {
          await redis.set(key, serialized)
        }
        return
      } catch (error) {
        logger.error('CacheService: Redis set error, using memory fallback', { error })
        this.useRedis = false
      }
    }

    await this.memoryCache.set(key, value, ttlSeconds)
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    await this.init()

    if (this.useRedis) {
      try {
        const redis = await getRedisConnection()
        await redis.del(key)
        return
      } catch (error) {
        logger.error('CacheService: Redis delete error, using memory fallback', { error })
        this.useRedis = false
      }
    }

    await this.memoryCache.delete(key)
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    await this.init()

    if (this.useRedis) {
      try {
        const redis = await getRedisConnection()
        const exists = await redis.exists(key)
        return exists === 1
      } catch (error) {
        logger.error('CacheService: Redis exists error, using memory fallback', { error })
        this.useRedis = false
      }
    }

    return this.memoryCache.has(key)
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<void> {
    await this.init()

    if (this.useRedis) {
      try {
        const redis = await getRedisConnection()
        await redis.flushdb()
        return
      } catch (error) {
        logger.error('CacheService: Redis flush error, using memory fallback', { error })
        this.useRedis = false
      }
    }

    await this.memoryCache.flush()
  }

  /**
   * Increment value in cache
   */
  async increment(key: string, value: number = 1, ttlSeconds?: number): Promise<number> {
    await this.init()

    if (this.useRedis) {
      try {
        const redis = await getRedisConnection()
        const newValue = await redis.incrby(key, value)
        if (ttlSeconds) {
          await redis.expire(key, ttlSeconds)
        }
        return newValue
      } catch (error) {
        logger.error('CacheService: Redis increment error, using memory fallback', { error })
        this.useRedis = false
      }
    }

    return this.memoryCache.increment(key, value)
  }

  /**
   * Decrement value in cache
   */
  async decrement(key: string, value: number = 1, ttlSeconds?: number): Promise<number> {
    return this.increment(key, -value, ttlSeconds)
  }

  /**
   * Get multiple values at once
   */
  async getMany<T = any>(keys: string[]): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>()

    await this.init()

    if (this.useRedis) {
      try {
        const redis = await getRedisConnection()
        const values = await redis.mget(...keys)
        keys.forEach((key, index) => {
          result.set(key, values[index] ? JSON.parse(values[index]!) : null)
        })
        return result
      } catch (error) {
        logger.error('CacheService: Redis mget error, using memory fallback', { error })
        this.useRedis = false
      }
    }

    // Memory fallback
    for (const key of keys) {
      result.set(key, await this.memoryCache.get<T>(key))
    }

    return result
  }

  /**
   * Set multiple values at once
   */
  async setMany(entries: Map<string, any>, ttlSeconds?: number): Promise<void> {
    await this.init()

    if (this.useRedis) {
      try {
        const redis = await getRedisConnection()
        const pipeline = redis.pipeline()

        for (const [key, value] of entries) {
          const serialized = JSON.stringify(value)
          if (ttlSeconds) {
            pipeline.setex(key, ttlSeconds, serialized)
          } else {
            pipeline.set(key, serialized)
          }
        }

        await pipeline.exec()
        return
      } catch (error) {
        logger.error('CacheService: Redis mset error, using memory fallback', { error })
        this.useRedis = false
      }
    }

    // Memory fallback
    for (const [key, value] of entries) {
      await this.memoryCache.set(key, value, ttlSeconds)
    }
  }
}
