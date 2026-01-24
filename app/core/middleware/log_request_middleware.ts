import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { inject } from '@adonisjs/core'
import LogService from '#core/services/log_service'
import app from '@adonisjs/core/services/app'

@inject()
export default class LogRequestMiddleware {
  constructor(protected logService: LogService) {}

  async handle(ctx: HttpContext, next: NextFn): Promise<void> {
    if (!app.inProduction && !app.inTest) {
      return next()
    }

    const startTime = Date.now()

    await next()

    const duration = Date.now() - startTime

    this.logService.logApiRequest(ctx, duration)
  }
}
