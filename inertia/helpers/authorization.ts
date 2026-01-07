import type { UserPresenterPublicData } from '#auth/presenters/user_presenter'

/**
 * Check if user has a specific role
 */
export function hasRole(user: UserPresenterPublicData | null, roleSlug: string): boolean {
  if (!user || !user.role) return false
  return user.role.slug === roleSlug
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: UserPresenterPublicData | null, roleSlugs: string[]): boolean {
  if (!user || !user.role) return false
  return roleSlugs.includes(user.role.slug)
}

/**
 * Check if user has all of the specified roles (usually just one role per user)
 */
export function hasAllRoles(user: UserPresenterPublicData | null, roleSlugs: string[]): boolean {
  if (!user || !user.role) return false
  // Since users typically have one role, this checks if that role is in the list
  return roleSlugs.every((slug) => slug === user.role?.slug)
}

/**
 * Check if user has a specific permission
 */
export function can(user: UserPresenterPublicData | null, permissionSlug: string): boolean {
  if (!user || !user.role || !user.role.permissions) return false
  return user.role.permissions.some((p) => p.slug === permissionSlug)
}

/**
 * Check if user has any of the specified permissions
 */
export function canAny(user: UserPresenterPublicData | null, permissionSlugs: string[]): boolean {
  if (!user || !user.role || !user.role.permissions) return false
  return user.role.permissions.some((p) => permissionSlugs.includes(p.slug))
}

/**
 * Check if user has all of the specified permissions
 */
export function canAll(user: UserPresenterPublicData | null, permissionSlugs: string[]): boolean {
  if (!user || !user.role || !user.role.permissions) return false
  return permissionSlugs.every((slug) => user.role!.permissions.some((p) => p.slug === slug))
}

/**
 * Get all user permissions
 */
export function getPermissions(user: UserPresenterPublicData | null): string[] {
  if (!user || !user.role || !user.role.permissions) return []
  return user.role.permissions.map((p) => p.slug)
}

/**
 * Get user role
 */
export function getRole(user: UserPresenterPublicData | null): string | null {
  if (!user || !user.role) return null
  return user.role.slug
}
