import { Head } from '@inertiajs/react'
import { AdminMain } from '~/components/layouts/admin/admin_main'
import { Panel } from '~/components/elements/panel'
import { getAdminResource } from '~/helpers/admin'
import { useTranslation } from 'react-i18next'
import { StatusEnum, UserStatus } from '~/components/admin/user_status'
import { AdminShowNav } from '~/components/layouts/admin/admin_show_nav'

interface Permission {
  id: number
  name: string
  slug: string
  category: string
}

interface Role {
  id: number
  name: string
  slug: string
  permissions?: Permission[]
}

interface User {
  id: number
  email: string
  fullName: string | null
  emailVerifiedAt: string | null
  pendingEmail: string | null
  role: Role | null
  status: StatusEnum
  githubId: string | null
  googleId: string | null
  facebookId: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface AdminUsersShowProps {
  user: User
}

export default function AdminUsersShowPage(props: AdminUsersShowProps) {
  const { user } = props
  const { t, i18n } = useTranslation('admin')

  const resource = getAdminResource('users')
  const rolesResource = getAdminResource('roles')

  const permissionsByCategory = user.role?.permissions?.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>) || {}

  return (
    <>
      <Head title={t('users.show', { email: user.email })} />
      <AdminMain title={user.email} icon={resource.icon}>
        <Panel
          header={
            <AdminShowNav
              resource={resource}
              item={{
                id: user.id,
                name: user.fullName || t('users.empty.no_name'),
                canBeModified: true,
                canBeDeleted: true,
              }}
            />
          }
        >
          <div className="grid gap-6">
            <div className="grid gap-4">
              <h3 className="heading-3">{t('users.information')}</h3>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                    {t('users.fields.email')}
                  </p>
                  <div className="flex-group align-items-center gap-2">
                    <p className="fs-400 clr-neutral-900">{user.email}</p>
                    <UserStatus status={user.status} id={user.id} />
                  </div>
                </div>

                {user.fullName && (
                  <div>
                    <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                      {t('users.fields.full_name')}
                    </p>
                    <p className="fs-400 clr-neutral-900">{user.fullName}</p>
                  </div>
                )}

                {user.pendingEmail && (
                  <div className="lg:col-span-2">
                    <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                      {t('users.fields.pending_email')}
                    </p>
                    <p className="fs-400 clr-orange-700">{user.pendingEmail}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-4 border-top-1 border-neutral-300 padding-block-start-6">
              <h3 className="heading-3">{t('users.timeline')}</h3>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="padding-4 bg-neutral-050 border-radius-2">
                  <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                    {t('users.fields.created_at')}
                  </p>
                  <p className="fs-400 clr-neutral-900">{i18n.format(new Date(user.createdAt!), 'full', i18n.language, { withTime: true})}</p>
                </div>

                <div className="padding-4 bg-neutral-050 border-radius-2">
                  <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                    {t('users.fields.last_updated')}
                  </p>
                  <p className="fs-400 clr-neutral-900">{i18n.format(new Date(user.updatedAt!), 'full', i18n.language, { withTime: true})}</p>
                </div>

                {user.emailVerifiedAt && (
                  <div className="padding-4 bg-neutral-050 border-radius-2">
                    <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                      {t('users.fields.email_verified_at')}
                    </p>
                    <p className="fs-400 clr-neutral-900">{i18n.format(new Date(user.emailVerifiedAt!), 'full', i18n.language)}</p>
                  </div>
                )}
              </div>
            </div>
            {(user.githubId || user.googleId || user.facebookId) && (
              <div className="grid gap-4 border-top-1 border-neutral-300 padding-block-start-6">
                <h3 className="heading-3">{t('users.connected_accounts')}</h3>

                <div className="grid gap-3">
                  {user.githubId && (
                    <div className="flex-group align-items-center gap-3 padding-3 bg-neutral-050 border-radius-2">
                      <svg
                        className="w-4 h-4 clr-neutral-900"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      <div>
                        <p className="fw-medium fs-400 clr-neutral-900">GitHub</p>
                        <p className="fs-300 clr-neutral-600 font-mono">ID: {user.githubId}</p>
                      </div>
                    </div>
                  )}

                  {user.googleId && (
                    <div className="flex-group align-items-center gap-3 padding-3 bg-neutral-050 border-radius-2">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <div>
                        <p className="fw-medium fs-400 clr-neutral-900">Google</p>
                        <p className="fs-300 clr-neutral-600 font-mono">ID: {user.googleId}</p>
                      </div>
                    </div>
                  )}

                  {user.facebookId && (
                    <div className="flex-group align-items-center gap-3 padding-3 bg-neutral-050 border-radius-2">
                      <svg
                        className="w-4 h-4"
                        fill="#1877F2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <div>
                        <p className="fw-medium fs-400 clr-neutral-900">Facebook</p>
                        <p className="fs-300 clr-neutral-600 font-mono">ID: {user.facebookId}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid gap-4 border-top-1 border-neutral-300 padding-block-start-6">
              <h3 className="heading-3">{t('users.role_permissions')}</h3>
              {user.role ? (
                <div className="padding-4 bg-neutral-050 border-radius-2">
                  <div className="flex-group justify-content-space-between align-items-center">
                    <div>
                      <p className="fs-300 fw-semi-bold clr-neutral-600 margin-block-end-1">
                        {t('users.fields.current_role')}
                      </p>
                      <p className="fs-400 fw-bold clr-neutral-900">{user.role.name}</p>
                      <p className="fs-300 clr-neutral-600 font-mono">{user.role.slug}</p>
                    </div>
                    <a
                      href={rolesResource.show?.path(user.role.id)}
                      className="clr-primary-500 hover:clr-primary-600 transition:clr-300"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="padding-8 text-center bg-neutral-050 border-radius-2">
                  <p className="fs-400 clr-neutral-600">{t('users.empty.no_role_assigned')}</p>
                </div>
              )}

              {user.role && Object.keys(permissionsByCategory).length > 0 && (
                <div className="grid gap-4 border-top-1 border-neutral-300 padding-block-start-6">
                  <p className="fs-300 fw-semi-bold clr-neutral-600">
                    {t('users.permissions_from_role', { count: user.role.permissions?.length || 0 })}
                  </p>
                  <div className="grid gap-3">
                    {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                      <div
                        key={category}
                        className="border-1 border-solid border-neutral-300 border-radius-2"
                      >
                        <div className="border-radius-2 padding-3 bg-neutral-100">
                          <p className="fs-400 fw-semi-bold clr-neutral-900">
                            {category}{' '}
                            <span className="fs-300 clr-neutral-600">
                                  ({permissions.length})
                                </span>
                          </p>
                        </div>
                        <div className="padding-3 grid gap-2">
                          {permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex-group align-items-center gap-2 padding-2 bg-neutral-050 border-radius-1"
                            >
                              <svg
                                className="w-3 h-3 clr-green-500"
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
                              <span className="fs-300 clr-neutral-900">{permission.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </AdminMain>
    </>
  )
}
