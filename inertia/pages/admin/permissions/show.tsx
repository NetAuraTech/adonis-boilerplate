import { useTranslation } from 'react-i18next'
import { AdminMain } from '~/components/layouts/admin/admin_main'
import { Panel } from '~/components/elements/panel'
import { getAdminResource } from '~/helpers/admin'
import { AdminShowNav } from '~/components/layouts/admin/admin_show_nav'

interface Role {
  id: number
  name: string
  slug: string
}

interface Permission {
  id: number
  name: string
  slug: string
  category: string
  description: string | null
  isSystem: boolean
  canBeDeleted: boolean
  canBeModified: boolean
  roles: Role[]
}

interface AdminPermissionsShowProps {
  permission: Permission
}

export default function AdminPermissionsShowPage(props: AdminPermissionsShowProps) {
  const { permission } = props
  const { t } = useTranslation('admin')

  const resource = getAdminResource('permissions')
  const rolesResource = getAdminResource('roles')

  const warningActions = permission.canBeModified
    ? t('permissions.warnings.deleted')
    : t('permissions.warnings.modified_or_deleted')

  return (
    <>
      <AdminMain title={resource.show?.label(permission.name)} icon={resource.icon}>
        <div className="grid gap-4">
          <Panel
            header={
              <AdminShowNav
                resource={resource}
                item={{
                  id: permission.id,
                  name: permission.name,
                  canBeModified: permission.canBeModified,
                  canBeDeleted: permission.canBeDeleted
                }}
              />
            }
          >
            <div className="grid gap-6">
              <div className="grid gap-4">
                <h3 className="heading-3">{t('permissions.information')}</h3>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                      {t('permissions.fields.name')}
                    </p>
                    <p className="fs-400 clr-neutral-900">{permission.name}</p>
                  </div>
                  <div>
                    <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                      {t('permissions.fields.slug')}
                    </p>
                    <p className="fs-400 clr-neutral-900 font-mono">{permission.slug}</p>
                  </div>
                  <div>
                    <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                      {t('permissions.fields.category')}
                    </p>
                    <p className="fs-400 clr-neutral-900">
                      <span className="bg-neutral-200 clr-neutral-900 padding-inline-3 padding-block-2 border-radius-1 fs-300 fw-semi-bold">
                        {permission.category}
                      </span>
                    </p>
                  </div>
                  {permission.description && (
                    <div className="lg:col-span-2">
                      <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                        {t('permissions.fields.description')}
                      </p>
                      <p className="fs-400 clr-neutral-900">{permission.description}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-4 border-top-1 border-neutral-300 padding-block-start-6">
                <h3 className="heading-3">{t('permissions.statistics')}</h3>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="padding-4 bg-neutral-050 border-radius-2">
                    <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                      {t('permissions.stats.roles_count')}
                    </p>
                    <p className="fs-600 fw-bold clr-primary-500">{permission.roles.length}</p>
                  </div>
                  <div className="padding-4 bg-neutral-050 border-radius-2">
                    <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                      {t('permissions.stats.permission_type')}
                    </p>
                    <div className="flex-group align-items-center gap-2">
                      {permission.isSystem ? (
                        <span className="fs-300 fw-semi-bold clr-orange-600 bg-orange-100 padding-inline-3 padding-block-2 border-radius-1">
                          {t('permissions.types.system')}
                        </span>
                      ) : (
                        <span className="fs-300 fw-semi-bold clr-blue-600 bg-blue-100 padding-inline-3 padding-block-2 border-radius-1">
                          {t('permissions.types.custom')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {permission.isSystem && (
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
                        <p className="fs-400 fw-semi-bold clr-yellow-800">
                          {t('permissions.types.system')}
                        </p>
                        <p className="fs-300 clr-yellow-700 margin-block-start-1">
                          {t('permissions.warnings.system_permission', { actions: warningActions })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid gap-4 border-top-1 border-neutral-300 padding-block-start-6">
                <div className="flex-group justify-content-space-between align-items-center">
                  <h3 className="heading-3">{t('permissions.assigned_roles')}</h3>
                  <p className="fs-300 clr-neutral-600">
                    {t('permissions.roles_assigned', { count: permission.roles.length })}
                  </p>
                </div>
                {permission.roles.length === 0 ? (
                  <div className="padding-8 text-center bg-neutral-050 border-radius-2">
                    <svg
                      className="w-8 h-8 clr-neutral-400 margin-inline-auto margin-block-end-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
                      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                    </svg>
                    <p className="fs-400 clr-neutral-600">
                      {t('permissions.empty.no_roles')}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {permission.roles.map((role) => (
                      <a
                        key={role.id}
                        href={rolesResource.show?.path(role.id)}
                        className="display-flex align-items-center justify-content-space-between padding-4 bg-neutral-050 border-radius-2 hover:bg-neutral-100 transition:bg-300 clr-neutral-900 hover:clr-primary-500 transition:clr-300"
                      >
                        <div className="flex-group align-items-center gap-3">
                          <svg
                            className="w-3 h-3 clr-primary-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
                            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                          </svg>
                          <div>
                            <p className="fw-medium fs-400">{role.name}</p>
                            <p className="fs-300 clr-neutral-600 font-mono">{role.slug}</p>
                          </div>
                        </div>
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </AdminMain>
    </>
  )
}
