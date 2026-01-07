import { ReactNode } from 'react'
import { useAuth } from '~/hooks/use_auth'

interface HasRoleProps {
  role?: string
  roles?: string[]
  requireAll?: boolean
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Component to conditionally render based on roles
 *
 * Usage:
 * <HasRole role="admin">
 *   <AdminPanel />
 * </HasRole>
 *
 * <HasRole roles={["admin", "moderator"]}>
 *   <ModeratorTools />
 * </HasRole>
 */
export function HasRole(props: HasRoleProps) {
  const { role, roles, requireAll = false, fallback = null, children } = props
  const { hasRole, hasAnyRole, hasAllRoles } = useAuth()

  let hasAccess = false

  if (role) {
    hasAccess = hasRole(role)
  } else if (roles) {
    hasAccess = requireAll ? hasAllRoles(roles) : hasAnyRole(roles)
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}
