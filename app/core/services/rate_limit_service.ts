import { DateTime } from 'luxon'
import { isRedisAvailable, getRedisConnection } from '#core/helpers/redis'
import RateLimit from '#core/models/rate_limit'
import { inject } from '@adonisjs/core'
import LogService, { LogCategory } from '#core/services/log_service'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: DateTime
  retryAfter?: number
}

@inject()
export default class RateLimitService {
  private useRedis: boolean | null = null

  constructor(protected logService: LogService) {}

  /**
   * Initialize rate limiter (check Redis availability)
   */
  private async init() {
    if (this.useRedis === null) {
      this.useRedis = await isRedisAvailable()
      if (this.useRedis) {
        this.logService.info({
          message: 'RateLimitService: Using Redis',
          category: LogCategory.SYSTEM,
        })
      } else {
        this.logService.info({
          message: 'RateLimitService: Using Database fallback',
          category: LogCategory.SYSTEM,
        })
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
        this.logService.error({
          message: 'RateLimitService: Redis error, using database fallback',
          category: LogCategory.SYSTEM,
          error,
          metadata: { key },
        })
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

    let hits = await redis.get(redisKey)
    let current = hits ? Number.parseInt(hits, 10) : 0

    if (current === 0) {
      await redis.setex(redisKey, decaySeconds, '1')
      current = 1
    } else {
      current = await redis.incr(redisKey)
    }

    const ttl = await redis.ttl(redisKey)
    const resetAt = now.plus({ seconds: ttl > 0 ? ttl : decaySeconds })
    const remaining = Math.max(0, maxAttempts - current)

    const result: RateLimitResult = {
      allowed: current <= maxAttempts,
      remaining,
      resetAt,
      retryAfter: current > maxAttempts ? ttl : undefined,
    }

    if (!result.allowed) {
      this.logService.logSecurity('Rate limit exceeded', {
        key,
        current,
        maxAttempts,
        retryAfter: result.retryAfter,
      })
    }

    return result
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

    let rateLimit = await RateLimit.query().where('key', key).first()

    if (!rateLimit) {
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

    if (rateLimit.resetAt < now) {
      rateLimit.hits = 1
      rateLimit.resetAt = now.plus({ seconds: decaySeconds })
      await rateLimit.save()

      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetAt: rateLimit.resetAt,
      }
    }

    rateLimit.hits += 1
    await rateLimit.save()

    const remaining = Math.max(0, maxAttempts - rateLimit.hits)
    const retryAfter =
      rateLimit.hits > maxAttempts
        ? Math.ceil(rateLimit.resetAt.diff(now, 'seconds').seconds)
        : undefined

    const result: RateLimitResult = {
      allowed: rateLimit.hits <= maxAttempts,
      remaining,
      resetAt: rateLimit.resetAt,
      retryAfter,
    }

    if (!result.allowed) {
      this.logService.logSecurity('Rate limit exceeded', {
        key,
        current: rateLimit.hits,
        maxAttempts,
        retryAfter: result.retryAfter,
      })
    }

    return result
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

        this.logService.debug({
          message: 'Rate limit reset',
          category: LogCategory.SYSTEM,
          metadata: { key },
        })
        return
      } catch (error) {
        this.logService.error({
          message: 'RateLimitService: Redis reset error, using database fallback',
          category: LogCategory.SYSTEM,
          error,
          metadata: { key },
        })
        this.useRedis = false
      }
    }

    await RateLimit.query().where('key', key).delete()

    this.logService.debug({
      message: 'Rate limit reset',
      category: LogCategory.SYSTEM,
      metadata: { key },
    })
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
        this.logService.error({
          message: 'RateLimitService: Redis remaining error, using database fallback',
          category: LogCategory.SYSTEM,
          error,
          metadata: { key },
        })
        this.useRedis = false
      }
    }

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

        this.logService.info({
          message: 'All rate limits cleared (Redis)',
          category: LogCategory.SYSTEM,
          metadata: { count: keys.length },
        })
        return
      } catch (error) {
        this.logService.error({
          message: 'RateLimitService: Redis clear error, using database fallback',
          category: LogCategory.SYSTEM,
          error,
        })
        this.useRedis = false
      }
    }

    const count = await RateLimit.query().delete()

    this.logService.info({
      message: 'All rate limits cleared (Database)',
      category: LogCategory.SYSTEM,
      metadata: { count },
    })
  }
}
