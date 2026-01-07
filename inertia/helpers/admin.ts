import { ActionKey, AdminNavCategory, AdminResource, AdminNavCategoryDisplay } from '~/types/admin'
import i18n from 'i18next'

const t = (key: string, options?: Record<string, any>) => {
  return i18n.t(key, { ...options, ns: 'admin' })
}

export function createAdminResources(): AdminResource {
  return {
    users: {
      get label() {
        return t('resources.users.label')
      },
      icon:
        '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.128a4 4 0 0 1 0 7.744M22 21v-2a4 4 0 0 0-3-3.87"/>' +
        '<circle cx="9" cy="7" r="4"/>',
      index: {
        label: () => t('resources.users.index'),
        path: () => buildAdminUrl('users'),
        can: (can = true) => can,
        permission: 'users.view',
      },
      create: {
        label: () => t('resources.users.create'),
        path: () => buildAdminUrl('users', 'create'),
        can: (can = true) => can,
        permission: 'users.create',
      },
      store: {
        label: () => t('resources.users.store'),
        path: () => buildAdminUrl('users', 'store'),
        can: (can = true) => can,
        permission: 'users.create',
      },
      show: {
        label: (label) => t('resources.users.show', { label }),
        path: (id) => buildAdminUrl('users', 'show', id),
        can: (can = true) => can,
        permission: 'users.view',
      },
      edit: {
        label: (label) => t('resources.users.edit', { label }),
        path: (id) => buildAdminUrl('users', 'edit', id),
        can: (can = true) => can,
        permission: 'users.update',
      },
      update: {
        label: () => t('resources.users.update'),
        path: (id) => buildAdminUrl('users', 'update', id),
        can: (can = true) => can,
        permission: 'users.update',
      },
      delete: {
        label: (label) => t('resources.users.delete', { label }),
        path: (id) => buildAdminUrl('users', 'delete', id),
        get confirm_message() {
          return t('resources.users.delete_confirm')
        },
        can: (can = true) => can,
        permission: 'users.delete',
      },
    },
    roles: {
      get label() {
        return t('resources.roles.label')
      },
      icon:
        '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/>' +
        '<circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
      index: {
        label: () => t('resources.roles.index'),
        path: () => buildAdminUrl('roles'),
        can: (can = true) => can,
        permission: 'roles.view',
      },
      create: {
        label: () => t('resources.roles.create'),
        path: () => buildAdminUrl('roles', 'create'),
        can: (can = true) => can,
        permission: 'roles.create',
      },
      store: {
        label: () => t('resources.roles.store'),
        path: () => buildAdminUrl('roles', 'store'),
        can: (can = true) => can,
        permission: 'roles.create',
      },
      show: {
        label: (label) => t('resources.roles.show', { label }),
        path: (id) => buildAdminUrl('roles', 'show', id),
        can: (can = true) => can,
        permission: 'roles.view',
      },
      edit: {
        label: (label) => t('resources.roles.edit', { label }),
        path: (id) => buildAdminUrl('roles', 'edit', id),
        can: (can = true) => can,
        permission: 'roles.update',
      },
      update: {
        label: () => t('resources.roles.update'),
        path: (id) => buildAdminUrl('roles', 'update', id),
        can: (can = true) => can,
        permission: 'roles.update',
      },
      delete: {
        label: (label) => t('resources.roles.delete', { label }),
        path: (id) => buildAdminUrl('roles', 'delete', id),
        get confirm_message() {
          return t('resources.roles.delete_confirm')
        },
        can: (can = true) => can,
        permission: 'roles.delete',
      },
    },
    permissions: {
      get label() {
        return t('resources.permissions.label')
      },
      icon:
        '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>' +
        '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      index: {
        label: () => t('resources.permissions.index'),
        path: () => buildAdminUrl('permissions'),
        can: (can = true) => can,
        permission: 'permissions.view',
      },
      create: {
        label: () => t('resources.permissions.create'),
        path: () => buildAdminUrl('permissions', 'create'),
        can: (can = true) => can,
        permission: 'permissions.create',
      },
      store: {
        label: () => t('resources.permissions.store'),
        path: () => buildAdminUrl('permissions', 'store'),
        can: (can = true) => can,
        permission: 'permissions.create',
      },
      show: {
        label: (label) => t('resources.permissions.show', { label }),
        path: (id) => buildAdminUrl('permissions', 'show', id),
        can: (can = true) => can,
        permission: 'permissions.view',
      },
      edit: {
        label: (label) => t('resources.permissions.edit', { label }),
        path: (id) => buildAdminUrl('permissions', 'edit', id),
        can: (can = true) => can,
        permission: 'permissions.update',
      },
      update: {
        label: () => t('resources.permissions.update'),
        path: (id) => buildAdminUrl('permissions', 'update', id),
        can: (can = true) => can,
        permission: 'permissions.update',
      },
      delete: {
        label: (label) => t('resources.permissions.delete', { label }),
        path: (id) => buildAdminUrl('permissions', 'delete', id),
        get confirm_message() {
          return t('resources.permissions.delete_confirm')
        },
        can: (can = true) => can,
        permission: 'permissions.delete',
      },
    },
  }
}
export const adminResources = createAdminResources()

export function createAdminNavigationConfig(): AdminNavCategory[] {
  return [
    {
      get label() {
        return t('common.navigation.access_control')
      },
      resourceKeys: ['users', 'roles', 'permissions'],
    },
  ]
}

export const adminNavigationConfig = createAdminNavigationConfig()

export function buildAdminUrl(resource: keyof AdminResource, action?: ActionKey, id?: number) {
  const path = `/admin/${resource}`

  switch (action) {
    case 'index':
      return path
    case 'create':
      return `${path}/create`
    case 'store':
      return path
    case 'show':
      return `${path}/${id}`
    case 'edit':
      return `${path}/${id}/edit`
    case 'update':
    case 'delete':
      return `${path}/${id}`
    default:
      return path
  }
}

export function buildAdminNav(): AdminNavCategoryDisplay[] {
  const resources = createAdminResources()
  const navConfig = createAdminNavigationConfig()

  return navConfig.map((category) => ({
    label: category.label,
    links: category.resourceKeys.flatMap((key) => {
      const resource = resources[key]

      if (!resource || !resource.index) {
        return []
      }

      return [
        {
          label: resource.label,
          path: resource.index.path(),
          permission: resource.index.permission,
          icon: resource.icon,
        },
      ]
    }),
  }))
}

export function getAdminResource<K extends keyof AdminResource>(key: K): AdminResource[K] {
  return adminResources[key]
}
