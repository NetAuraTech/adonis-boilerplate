import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import RateLimit from '#core/models/rate_limit'

export default class CleanupRateLimits extends BaseCommand {
  static commandName = 'cleanup:rate-limits'
  static description = 'Clean expired rate limit entries from database'
  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Cleaning expired rate limits...')

    const deleted = await RateLimit.cleanExpired()

    if (deleted > 0) {
      this.logger.success(`Deleted ${deleted} expired rate limit entries`)
    } else {
      this.logger.info('No expired rate limits to clean')
    }
  }
}
