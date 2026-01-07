import User from '#auth/models/user'

/**
 * Check if user has a specific permission
 */
export async function can(user: User | undefined | null, permission: string): Promise<boolean> {
  if (!user) return false
  return user.can(permission)
}

/**
 * Check if user has a specific role
 */
export async function hasRole(user: User | undefined | null, role: string): Promise<boolean> {
  if (!user) return false
  return user.hasRole(role)
}

/**
 * Check if user has any of the given roles
 */
export async function hasAnyRole(user: User | undefined | null, roles: string[]): Promise<boolean> {
  if (!user) return false
  return user.hasAnyRole(roles)
}

/**
 * Check if user is admin
 */
export async function isAdmin(user: User | undefined | null): Promise<boolean> {
  if (!user) return false
  return user.isAdmin()
}

/**
 * Get user's role name
 */
export async function getUserRole(user: User | undefined | null): Promise<string | null> {
  if (!user || !user.roleId) return null

  const role = await user.related('role').query().first()
  return role?.name || null
}

/**
 * Get user's permissions slugs
 */
export async function getUserPermissions(user: User | undefined | null): Promise<string[]> {
  if (!user || !user.roleId) return []

  const role = await user.related('role').query().preload('permissions').first()
  return role?.permissions.map((p) => p.slug) || []
}
