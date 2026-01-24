import { isRedisAvailable, getRedisConnection } from '#core/helpers/redis'
import { inject } from '@adonisjs/core'
import LogService, { LogCategory } from '#core/services/log_service'

/**
 * In-memory cache fallback
 */
class MemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number | null }>()

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item) return null

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
@inject()
export default class CacheService {
  private memoryCache = new MemoryCache()
  private useRedis: boolean | null = null

  constructor(protected logService: LogService) {}

  /**
   * Initialize cache (check Redis availability)
   */
  private async init() {
    if (this.useRedis === null) {
      this.useRedis = await isRedisAvailable()
      if (this.useRedis) {
        this.logService.info({
          message: 'CacheService: Using Redis',
          category: LogCategory.SYSTEM,
        })
      } else {
        this.logService.info({
          message: 'CacheService: Using Memory fallback',
          category: LogCategory.SYSTEM,
        })
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
        this.logService.error({
          message: 'CacheService: Redis get error, using memory fallback',
          category: LogCategory.SYSTEM,
          error,
          metadata: { key },
        })
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
        this.logService.error({
          message: 'CacheService: Redis set error, using memory fallback',
          category: LogCategory.SYSTEM,
          error,
          metadata: { key },
        })
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
        this.logService.error({
          message: 'CacheService: Redis delete error, using memory fallback',
          category: LogCategory.SYSTEM,
          error,
          metadata: { key },
        })
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
        this.logService.error({
          message: 'CacheService: Redis exists error, using memory fallback',
          category: LogCategory.SYSTEM,
          error,
          metadata: { key },
        })
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

        this.logService.info({
          message: 'Cache flushed (Redis)',
          category: LogCategory.SYSTEM,
        })
        return
      } catch (error) {
        this.logService.error({
          message: 'CacheService: Redis flush error, using memory fallback',
          category: LogCategory.SYSTEM,
          error,
        })
        this.useRedis = false
      }
    }

    await this.memoryCache.flush()

    this.logService.info({
      message: 'Cache flushed (Memory)',
      category: LogCategory.SYSTEM,
    })
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
        this.logService.error({
          message: 'CacheService: Redis increment error, using memory fallback',
          category: LogCategory.SYSTEM,
          error,
          metadata: { key },
        })
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
        this.logService.error({
          message: 'CacheService: Redis mget error, using memory fallback',
          category: LogCategory.SYSTEM,
          error,
          metadata: { keysCount: keys.length },
        })
        this.useRedis = false
      }
    }

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
        this.logService.error({
          message: 'CacheService: Redis mset error, using memory fallback',
          category: LogCategory.SYSTEM,
          error,
          metadata: { entriesCount: entries.size },
        })
        this.useRedis = false
      }
    }

    for (const [key, value] of entries) {
      await this.memoryCache.set(key, value, ttlSeconds)
    }
  }
}
