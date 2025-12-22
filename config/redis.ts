import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

const redisConfig = defineConfig({
  connection: env.get('REDIS_ENABLED') ? 'main' : 'local',

  connections: {
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD'),
      db: 0,
      keyPrefix: '',
      retryStrategy(times) {
        // Retry 3 times max, then fallback
        if (times > 3) {
          return null
        }
        return Math.min(times * 50, 2000)
      },
      lazyConnect: true,
    },

    // Local fallback (never used, just for config validation)
    local: {
      host: '127.0.0.1',
      port: 6379,
      lazyConnect: true,
    },
  },
})

export default redisConfig

declare module '@adonisjs/redis/types' {
  export interface RedisConnections {
    main: typeof redisConfig.connections.main
    local: typeof redisConfig.connections.local
  }
}
