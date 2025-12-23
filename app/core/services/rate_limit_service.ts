import { DateTime } from 'luxon'
import { isRedisAvailable, getRedisConnection } from '#core/helpers/redis'
import RateLimit from '#core/models/rate_limit'
import logger from '@adonisjs/core/services/logger'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: DateTime
  retryAfter?: number
}

export default class RateLimitService {
  private useRedis: boolean | null = null

  /**
   * Initialize rate limiter (check Redis availability)
   */
  private async init() {
    if (this.useRedis === null) {
      this.useRedis = await isRedisAvailable()
      if (this.useRedis) {
        logger.info('RateLimitService: Using Redis')
      } else {
        logger.info('RateLimitService: Using Database fallback')
      }
    }
  }

  /**
   * Check if request is allowed
   */
  async attempt(key: string, maxAttempts: number, decaySeconds: number): Promise<RateLimitResult> {
    await this.init()

    if (this.useRedis) {
      try {
        return await this.attemptRedis(key, maxAttempts, decaySeconds)
      } catch (error) {
        logger.error('RateLimitService: Redis error, using database fallback', { error })
        this.useRedis = false
      }
    }

    return this.attemptDatabase(key, maxAttempts, decaySeconds)
  }

  /**
   * Redis implementation
   */
  private async attemptRedis(
    key: string,
    maxAttempts: number,
    decaySeconds: number
  ): Promise<RateLimitResult> {
    const redis = await getRedisConnection()
    const now = DateTime.now()
    const redisKey = `rate_limit:${key}`

    // Get current hits
    let hits = await redis.get(redisKey)
    let current = hits ? Number.parseInt(hits, 10) : 0

    if (current === 0) {
      // First hit, set expiration
      await redis.setex(redisKey, decaySeconds, '1')
      current = 1
    } else {
      // Increment hits
      current = await redis.incr(redisKey)
    }

    const ttl = await redis.ttl(redisKey)
    const resetAt = now.plus({ seconds: ttl > 0 ? ttl : decaySeconds })
    const remaining = Math.max(0, maxAttempts - current)

    return {
      allowed: current <= maxAttempts,
      remaining,
      resetAt,
      retryAfter: current > maxAttempts ? ttl : undefined,
    }
  }

  /**
   * Database implementation
   */
  private async attemptDatabase(
    key: string,
    maxAttempts: number,
    decaySeconds: number
  ): Promise<RateLimitResult> {
    const now = DateTime.now()

    // Find or create rate limit entry
    let rateLimit = await RateLimit.query().where('key', key).first()

    if (!rateLimit) {
      // Create new entry
      rateLimit = await RateLimit.create({
        key,
        hits: 1,
        resetAt: now.plus({ seconds: decaySeconds }),
      })

      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetAt: rateLimit.resetAt,
      }
    }

    // Check if expired
    if (rateLimit.resetAt < now) {
      // Reset counter
      rateLimit.hits = 1
      rateLimit.resetAt = now.plus({ seconds: decaySeconds })
      await rateLimit.save()

      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetAt: rateLimit.resetAt,
      }
    }

    // Increment hits
    rateLimit.hits += 1
    await rateLimit.save()

    const remaining = Math.max(0, maxAttempts - rateLimit.hits)
    const retryAfter =
      rateLimit.hits > maxAttempts
        ? Math.ceil(rateLimit.resetAt.diff(now, 'seconds').seconds)
        : undefined

    return {
      allowed: rateLimit.hits <= maxAttempts,
      remaining,
      resetAt: rateLimit.resetAt,
      retryAfter,
    }
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    await this.init()

    if (this.useRedis) {
      try {
        const redis = await getRedisConnection()
        await redis.del(`rate_limit:${key}`)
        return
      } catch (error) {
        logger.error('RateLimitService: Redis reset error, using database fallback', { error })
        this.useRedis = false
      }
    }

    // Database fallback
    await RateLimit.query().where('key', key).delete()
  }

  /**
   * Get remaining attempts for a key
   */
  async remaining(key: string, maxAttempts: number): Promise<number> {
    await this.init()

    if (this.useRedis) {
      try {
        const redis = await getRedisConnection()
        const hits = await redis.get(`rate_limit:${key}`)
        const current = hits ? Number.parseInt(hits, 10) : 0
        return Math.max(0, maxAttempts - current)
      } catch (error) {
        logger.error('RateLimitService: Redis remaining error, using database fallback', { error })
        this.useRedis = false
      }
    }

    // Database fallback
    const rateLimit = await RateLimit.query().where('key', key).first()
    if (!rateLimit) return maxAttempts

    const now = DateTime.now()
    if (rateLimit.resetAt < now) return maxAttempts

    return Math.max(0, maxAttempts - rateLimit.hits)
  }

  /**
   * Clear all rate limits (useful for tests)
   */
  async clear(): Promise<void> {
    await this.init()

    if (this.useRedis) {
      try {
        const redis = await getRedisConnection()
        const keys = await redis.keys('rate_limit:*')
        if (keys.length > 0) {
          await redis.del(...keys)
        }
        return
      } catch (error) {
        logger.error('RateLimitService: Redis clear error, using database fallback', { error })
        this.useRedis = false
      }
    }

    // Database fallback
    await RateLimit.query().delete()
  }
}
