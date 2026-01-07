import { ReactNode } from 'react'
import { useAuth } from '~/hooks/use_auth'

interface AuthenticatedProps {
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Component to conditionally render based on authentication status
 *
 * Usage:
 * <Authenticated>
 *   <UserMenu />
 * </Authenticated>
 *
 * <Authenticated fallback={<LoginButton />}>
 *   <UserDashboard />
 * </Authenticated>
 */
export function Authenticated(props: AuthenticatedProps) {
  const { fallback = null, children } = props
  const { isAuthenticated } = useAuth()

  return isAuthenticated ? <>{children}</> : <>{fallback}</>
}
