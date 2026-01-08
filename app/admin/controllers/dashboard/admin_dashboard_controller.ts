import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AdminDashboardService from '#admin/services/admin_dashboard_service'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminDashboardController {
  constructor(
    protected adminDashboardService: AdminDashboardService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia } = ctx

    try {
      const stats = await this.adminDashboardService.getStatistics()
      return inertia.render('admin/dashboard', { stats })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
