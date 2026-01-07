import { useTranslation } from 'react-i18next'
import { AdminMain } from '~/components/layouts/admin/admin_main'
import { Panel } from '~/components/elements/panel'
import { getAdminResource } from '~/helpers/admin'
import { useState } from 'react'
import { AdminShowNav } from '~/components/layouts/admin/admin_show_nav'

interface Permission {
  id: number
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  assigned?: boolean
}

interface Role {
  id: number
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  usersCount: number
  canBeDeleted: boolean
  canBeModified: boolean
}

interface AdminRolesShowProps {
  role: Role
  permissionsByCategory: Record<string, Permission[]>
}

export default function AdminRolesShowPage(props: AdminRolesShowProps) {
  const { role, permissionsByCategory } = props
  const { t } = useTranslation('admin')

  const resource = getAdminResource('roles')

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    Object.keys(permissionsByCategory).forEach((category) => {
      initial[category] = permissionsByCategory[category].some((p) => p.assigned)
    })
    return initial
  })

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const totalAssignedPermissions = Object.values(permissionsByCategory).reduce(
    (total, permissions) => {
      return total + permissions.filter((p) => p.assigned).length
    },
    0
  )

  const warningActions = role.canBeModified
    ? t('permissions.warnings.deleted')
    : t('permissions.warnings.modified_or_deleted')

  return (
    <>
      <AdminMain title={resource.show?.label(role.name)} icon={resource.icon}>
        <Panel
          header={
            <AdminShowNav
              resource={resource}
              item={{
                id: role.id,
                name: role.name,
                canBeModified: role.canBeModified,
                canBeDeleted: role.canBeDeleted
              }}
            />
          }
        >
          <div className="grid gap-6">
            <div className="grid gap-4">
              <h3 className="heading-3">{t('roles.information')}</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                    {t('roles.fields.name')}
                  </p>
                  <p className="fs-400 clr-neutral-900">{role.name}</p>
                </div>
                <div>
                  <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                    {t('permissions.fields.slug')}
                  </p>
                  <p className="fs-400 clr-neutral-900 font-mono">{role.slug}</p>
                </div>
                {role.description && (
                  <div className="lg:col-span-2">
                    <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                      {t('roles.fields.description')}
                    </p>
                    <p className="fs-400 clr-neutral-900">{role.description}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-4 border-top-1 border-neutral-300 padding-block-start-6">
              <h3 className="heading-3">{t('roles.statistics')}</h3>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="padding-4 bg-neutral-050 border-radius-2">
                  <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                    {t('roles.stats.users_count')}
                  </p>
                  <p className="fs-600 fw-bold clr-primary-500">{role.usersCount}</p>
                </div>
                <div className="padding-4 bg-neutral-050 border-radius-2">
                  <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                    {t('roles.stats.total_permissions')}
                  </p>
                  <p className="fs-600 fw-bold clr-accent-500">{totalAssignedPermissions}</p>
                </div>
                <div className="padding-4 bg-neutral-050 border-radius-2">
                  <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                    {t('roles.stats.role_type')}
                  </p>
                  <div className="flex-group align-items-center gap-2">
                    {role.isSystem ? (
                      <span className="fs-300 fw-semi-bold clr-orange-600 bg-orange-100 padding-inline-3 padding-block-2 border-radius-1">
                          {t('roles.types.system')}
                        </span>
                    ) : (
                      <span className="fs-300 fw-semi-bold clr-blue-600 bg-blue-100 padding-inline-3 padding-block-2 border-radius-1">
                          {t('roles.types.custom')}
                        </span>
                    )}
                  </div>
                </div>
              </div>
              {role.isSystem && (
                <div className="padding-4 bg-yellow-050 border-1 border-solid border-yellow-300 border-radius-2">
                  <div className="flex-group gap-2 align-items-start">
                    <svg
                      className="w-3 h-3 clr-yellow-700 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      style={{ marginTop: '0.125rem' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <p className="fs-400 fw-semi-bold clr-yellow-800">{t('roles.types.system')}</p>
                      <p className="fs-300 clr-yellow-700 margin-block-start-1">
                        {t('roles.warnings.system_role', { actions: warningActions })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-4 border-top-1 border-neutral-300 padding-block-start-6">
              <div className="flex-group justify-content-space-between align-items-center">
                <h3 className="heading-3">{t('roles.assigned_permissions')}</h3>
                <p className="fs-300 clr-neutral-600">
                  {t('roles.permissions.assigned_count', { count: totalAssignedPermissions })}
                </p>
              </div>
              {totalAssignedPermissions === 0 ? (
                <div className="padding-8 text-center bg-neutral-050 border-radius-2">
                  <svg
                    className="w-8 h-8 clr-neutral-400 margin-inline-auto margin-block-end-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <p className="fs-400 clr-neutral-600">{t('roles.permissions.no_permissions')}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                    const assignedPermissions = permissions.filter((p) => p.assigned)

                    if (assignedPermissions.length === 0) return null

                    const isExpanded = expandedCategories[category]

                    return (
                      <div
                        key={category}
                        className="border-1 border-solid border-neutral-300 border-radius-2 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="w-full bg-neutral-100 border-radius-2 padding-4 flex-group justify-content-space-between align-items-center text-left hover:bg-neutral-150 transition:bg-300"
                        >
                          <div className="flex-group align-items-center gap-2">
                            <svg
                              className={`w-3 h-3 clr-neutral-700 transition:transform-300 ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                            <span className="fw-semi-bold fs-400 clr-neutral-900">
                                {category}
                              </span>
                          </div>
                          <span className="fs-300 clr-neutral-600">
                              {t('roles.permissions.assigned_count', { count: assignedPermissions.length })}
                            </span>
                        </button>

                        {isExpanded && (
                          <div className="padding-4 grid gap-2">
                            {assignedPermissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="display-flex align-items-center gap-3 padding-3 bg-neutral-050 border-radius-1"
                              >
                                <svg
                                  className="w-3 h-3 clr-green-500 flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <div className="flex-1">
                                    <span className="fw-medium fs-400 clr-neutral-900">
                                      {permission.name}
                                    </span>
                                  {permission.isSystem && (
                                    <span className="margin-inline-start-2 fs-200 clr-neutral-600 bg-neutral-200 padding-inline-2 padding-block-1 border-radius-1">
                                        {t('roles.permissions.system_badge')}
                                      </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </Panel>
      </AdminMain>
    </>
  )
}
