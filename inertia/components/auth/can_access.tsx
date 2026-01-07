import { ReactNode } from 'react'
import { useAuth } from '~/hooks/use_auth'

interface CanAccessProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Component to conditionally render based on permissions
 *
 * Usage:
 * <CanAccess permission="users.create">
 *   <Button>Create User</Button>
 * </CanAccess>
 *
 * <CanAccess permissions={["users.create", "users.edit"]} requireAll>
 *   <Button>Manage Users</Button>
 * </CanAccess>
 */
export function CanAccess(props: CanAccessProps) {
  const { permission, permissions, requireAll = false, fallback = null, children } = props
  const { can, canAny, canAll } = useAuth()

  let hasAccess = false

  if (permission) {
    hasAccess = can(permission)
  } else if (permissions) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions)
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}
