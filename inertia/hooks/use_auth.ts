import { usePage } from '@inertiajs/react'
import * as authHelpers from '~/helpers/authorization'
import type { SharedProps } from '@adonisjs/inertia/types'

export function useAuth() {
  const pageProps = usePage<SharedProps>().props

  return {
    user: pageProps.currentUser,
    isAuthenticated: !!pageProps.currentUser,

    // Role checks
    hasRole: (roleSlug: string) => authHelpers.hasRole(pageProps.currentUser, roleSlug),
    hasAnyRole: (roleSlugs: string[]) => authHelpers.hasAnyRole(pageProps.currentUser, roleSlugs),
    hasAllRoles: (roleSlugs: string[]) => authHelpers.hasAllRoles(pageProps.currentUser, roleSlugs),

    // Permission checks
    can: (permissionSlug: string) => authHelpers.can(pageProps.currentUser, permissionSlug),
    canAny: (permissionSlugs: string[]) =>
      authHelpers.canAny(pageProps.currentUser, permissionSlugs),
    canAll: (permissionSlugs: string[]) =>
      authHelpers.canAll(pageProps.currentUser, permissionSlugs),

    // Getters
    getPermissions: () => authHelpers.getPermissions(pageProps.currentUser),
    getRole: () => authHelpers.getRole(pageProps.currentUser),
  }
}
