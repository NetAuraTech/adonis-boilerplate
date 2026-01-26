import { test } from '@japa/runner'
import DashboardService from '#admin/services/dashboard_service'
import { UserFactory, RoleFactory, PermissionFactory } from '#tests/helpers/factories'
import { DateTime } from 'luxon'
import Role from '#core/models/role'
import Permission from '#core/models/permission'
import app from '@adonisjs/core/services/app'

test.group('DashboardService', (group) => {
  let dashboardService: DashboardService

  group.setup(async () => {
    dashboardService = await app.container.make(DashboardService)
  })

  test('getStatistics: should return all statistics', async ({ assert }) => {
    const role = await RoleFactory.create()
    await UserFactory.create({ roleId: role.id })
    await PermissionFactory.create()

    const stats = await dashboardService.getStatistics()

    assert.exists(stats.totalUsers)
    assert.exists(stats.totalRoles)
    assert.exists(stats.totalPermissions)
    assert.exists(stats.usersThisMonth)
    assert.exists(stats.recentUsers)
    assert.exists(stats.usersByRole)
  })

  test('getStatistics: should count total users correctly', async ({ assert }) => {
    const role = await RoleFactory.create()
    await UserFactory.create({ roleId: role.id })
    await UserFactory.create({ roleId: role.id })
    await UserFactory.create({ roleId: role.id })

    const stats = await dashboardService.getStatistics()

    assert.equal(stats.totalUsers, 3)
  })

  test('getStatistics: should count total roles correctly', async ({ assert }) => {
    await Role.query().delete()
    await RoleFactory.create({ slug: 'role1' })
    await RoleFactory.create({ slug: 'role2' })
    await RoleFactory.create({ slug: 'role3' })

    const stats = await dashboardService.getStatistics()

    assert.equal(stats.totalRoles, 3)
  })

  test('getStatistics: should count total permissions correctly', async ({ assert }) => {
    await Permission.query().delete()
    await PermissionFactory.create({ name: 'Permission 1', slug: 'perm1' })
    await PermissionFactory.create({ name: 'Permission 2', slug: 'perm2' })
    await PermissionFactory.create({ name: 'Permission 3', slug: 'perm3' })
    await PermissionFactory.create({ name: 'Permission 4', slug: 'perm4' })

    const stats = await dashboardService.getStatistics()

    assert.equal(stats.totalPermissions, 4)
  })

  test('getStatistics: should count users created this month', async ({ assert }) => {
    const role = await RoleFactory.create()

    // Users created this month
    await UserFactory.create({
      roleId: role.id,
      createdAt: DateTime.now(),
    })
    await UserFactory.create({
      roleId: role.id,
      createdAt: DateTime.now().minus({ days: 5 }),
    })

    // User created last month
    await UserFactory.create({
      roleId: role.id,
      createdAt: DateTime.now().minus({ months: 1 }),
    })

    const stats = await dashboardService.getStatistics()

    assert.equal(stats.usersThisMonth, 2)
  })

  test('getStatistics: should return recent users (max 10)', async ({ assert }) => {
    const role = await RoleFactory.create()

    for (let i = 0; i < 15; i++) {
      await UserFactory.create({
        roleId: role.id,
        email: `user${i}@example.com`,
      })
    }

    const stats = await dashboardService.getStatistics()

    assert.isAtMost(stats.recentUsers.length, 10)
  })

  test('getStatistics: should order recent users by creation date (newest first)', async ({
    assert,
  }) => {
    const role = await RoleFactory.create()

    await UserFactory.create({
      roleId: role.id,
      email: 'oldest@example.com',
      createdAt: DateTime.now().minus({ days: 10 }),
    })

    await UserFactory.create({
      roleId: role.id,
      email: 'middle@example.com',
      createdAt: DateTime.now().minus({ days: 5 }),
    })

    await UserFactory.create({
      roleId: role.id,
      email: 'newest@example.com',
      createdAt: DateTime.now(),
    })

    const stats = await dashboardService.getStatistics()

    const recentEmails = stats.recentUsers.map((u) => u.email)
    const newestIndex = recentEmails.indexOf('newest@example.com')
    const middleIndex = recentEmails.indexOf('middle@example.com')
    const oldestIndex = recentEmails.indexOf('oldest@example.com')

    assert.isTrue(newestIndex < middleIndex)
    assert.isTrue(middleIndex < oldestIndex)
  })

  test('getStatistics: recent users should include role name', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Test Role' })
    await UserFactory.create({
      roleId: role.id,
      email: 'test@example.com',
    })

    const stats = await dashboardService.getStatistics()

    const user = stats.recentUsers.find((u) => u.email === 'test@example.com')
    assert.exists(user)
    assert.equal(user!.role, 'Test Role')
  })

  test('getStatistics: recent users without role should show "No role"', async ({ assert }) => {
    await UserFactory.create({
      roleId: null,
      email: 'norole@example.com',
    })

    const stats = await dashboardService.getStatistics()

    const user = stats.recentUsers.find((u) => u.email === 'norole@example.com')
    assert.exists(user)
    assert.equal(user!.role, 'No role')
  })

  test('getStatistics: should group users by role', async ({ assert }) => {
    await Role.query().delete()
    const role1 = await RoleFactory.create({ name: 'Admin', slug: 'admin1' })
    const role2 = await RoleFactory.create({ name: 'User', slug: 'user1' })

    await UserFactory.create({ roleId: role1.id })
    await UserFactory.create({ roleId: role1.id })
    await UserFactory.create({ roleId: role2.id })

    const stats = await dashboardService.getStatistics()

    const adminCount = stats.usersByRole.find((r) => r.role === 'Admin')
    const userCount = stats.usersByRole.find((r) => r.role === 'User')

    assert.exists(adminCount)
    assert.exists(userCount)
    assert.equal(adminCount!.count, 2)
    assert.equal(userCount!.count, 1)
  })

  test('getStatistics: should include users without role in usersByRole', async ({ assert }) => {
    await UserFactory.create({ roleId: null })
    await UserFactory.create({ roleId: null })

    const stats = await dashboardService.getStatistics()

    const noRoleCount = stats.usersByRole.find((r) => r.role === 'No role')
    assert.exists(noRoleCount)
    assert.equal(noRoleCount!.count, 2)
  })

  test('getStatistics: should handle empty database', async ({ assert }) => {
    const stats = await dashboardService.getStatistics()

    assert.isNumber(stats.totalUsers)
    assert.isNumber(stats.totalRoles)
    assert.isNumber(stats.totalPermissions)
    assert.isNumber(stats.usersThisMonth)
    assert.isArray(stats.recentUsers)
    assert.isArray(stats.usersByRole)
  })

  test('getStatistics: recent users should have correct structure', async ({ assert }) => {
    const role = await RoleFactory.create()
    await UserFactory.create({
      roleId: role.id,
      email: 'test@example.com',
      fullName: 'Test User',
    })

    const stats = await dashboardService.getStatistics()

    const user = stats.recentUsers[0]
    assert.exists(user.id)
    assert.exists(user.email)
    assert.exists(user.role)
    assert.exists(user.createdAt)
    assert.property(user, 'fullName')
  })

  test('getStatistics: usersByRole should have correct structure', async ({ assert }) => {
    const role = await RoleFactory.create()
    await UserFactory.create({ roleId: role.id })

    const stats = await dashboardService.getStatistics()

    const roleGroup = stats.usersByRole[0]
    assert.exists(roleGroup.role)
    assert.exists(roleGroup.count)
    assert.isString(roleGroup.role)
    assert.isNumber(roleGroup.count)
  })

  test('getStatistics: should handle multiple roles correctly', async ({ assert }) => {
    const role1 = await RoleFactory.create({ name: 'Role A', slug: 'role-a' })
    const role2 = await RoleFactory.create({ name: 'Role B', slug: 'role-b' })
    const role3 = await RoleFactory.create({ name: 'Role C', slug: 'role-c' })

    await UserFactory.create({ roleId: role1.id })
    await UserFactory.create({ roleId: role2.id })
    await UserFactory.create({ roleId: role3.id })

    const stats = await dashboardService.getStatistics()

    assert.equal(stats.usersByRole.length, 3)
  })

  test('getStatistics: should handle users created at month boundary', async ({ assert }) => {
    const role = await RoleFactory.create()

    const firstDayOfMonth = DateTime.now().startOf('month')
    await UserFactory.create({
      roleId: role.id,
      createdAt: firstDayOfMonth,
    })

    const lastDayOfLastMonth = DateTime.now().startOf('month').minus({ days: 1 })
    await UserFactory.create({
      roleId: role.id,
      createdAt: lastDayOfLastMonth,
    })

    const stats = await dashboardService.getStatistics()

    assert.equal(stats.usersThisMonth, 1)
  })

  test('getStatistics: performance with large dataset', async ({ assert }) => {
    const role = await RoleFactory.create()

    const users = []
    for (let i = 0; i < 50; i++) {
      users.push(
        UserFactory.create({
          roleId: role.id,
          email: `bulk${i}@example.com`,
        })
      )
    }
    await Promise.all(users)

    const startTime = Date.now()
    const stats = await dashboardService.getStatistics()
    const endTime = Date.now()

    assert.equal(stats.totalUsers, 50)
    assert.isAtMost(endTime - startTime, 5000) // Should complete in less than 5 seconds
  })
})
