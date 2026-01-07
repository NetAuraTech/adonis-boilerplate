import User from '#auth/models/user'
import Role from '#core/models/role'
import Permission from '#core/models/permission'
import db from '@adonisjs/lucid/services/db'

export interface DashboardStatistics {
  totalUsers: number
  totalRoles: number
  totalPermissions: number
  usersThisMonth: number
  recentUsers: Array<{
    id: number
    email: string
    fullName: string | null
    role: string
    createdAt: string | null
  }>
  usersByRole: Array<{
    role: string
    count: number
  }>
}

export default class AdminDashboardService {
  /**
   * Get dashboard statistics
   */
  async getStatistics(): Promise<DashboardStatistics> {
    const [totalUsers, totalRoles, totalPermissions, usersThisMonth, recentUsers, usersByRole] =
      await Promise.all([
        this.getTotalUsers(),
        this.getTotalRoles(),
        this.getTotalPermissions(),
        this.getUsersThisMonth(),
        this.getRecentUsers(),
        this.getUsersByRole(),
      ])

    return {
      totalUsers,
      totalRoles,
      totalPermissions,
      usersThisMonth,
      recentUsers,
      usersByRole,
    }
  }

  /**
   * Get total users count
   */
  private async getTotalUsers(): Promise<number> {
    const result = await User.query().count('* as total').first()
    return result?.$extras.total || 0
  }

  /**
   * Get total roles count
   */
  private async getTotalRoles(): Promise<number> {
    const result = await Role.query().count('* as total').first()
    return result?.$extras.total || 0
  }

  /**
   * Get total permissions count
   */
  private async getTotalPermissions(): Promise<number> {
    const result = await Permission.query().count('* as total').first()
    return result?.$extras.total || 0
  }

  /**
   * Get users created this month
   */
  private async getUsersThisMonth(): Promise<number> {
    const result = await User.query()
      .where('created_at', '>=', db.raw("DATE_TRUNC('month', CURRENT_DATE)"))
      .count('* as total')
      .first()
    return result?.$extras.total || 0
  }

  /**
   * Get recent users (last 10)
   */
  private async getRecentUsers() {
    const users = await User.query().preload('role').orderBy('created_at', 'desc').limit(10)

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role?.name || 'No role',
      createdAt: user.createdAt.toISO(),
    }))
  }

  /**
   * Get users count by role
   */
  private async getUsersByRole() {
    const results = await db
      .from('users')
      .select('roles.name as role_name')
      .count('users.id as total')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .groupBy('roles.name')

    return results.map((item) => ({
      role: item.role_name || 'No role',
      count: Number(item.total),
    }))
  }
}
