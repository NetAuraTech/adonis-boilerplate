import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AdminDashboardService from '#admin/services/admin_dashboard_service'

@inject()
export default class AdminDashboardController {
  constructor(protected adminDashboardService: AdminDashboardService) {}

  async render({ inertia }: HttpContext) {
    const stats = await this.adminDashboardService.getStatistics()

    return inertia.render('admin/dashboard', { stats })
  }
}
