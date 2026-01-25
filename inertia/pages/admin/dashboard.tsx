import { Head } from '@inertiajs/react'
import { AdminMain } from '~/components/layouts/admin/admin_main'
import { Panel } from '~/components/elements/panel'
import { useTranslation } from 'react-i18next'
import { CSSProperties } from 'react'

interface DashboardStats {
  totalUsers: number
  totalRoles: number
  totalPermissions: number
  usersThisMonth: number
  recentUsers: Array<{
    id: number
    email: string
    fullName: string | null
    role: string
    createdAt: string | null
  }>
  usersByRole: Array<{
    role: string
    count: number
  }>
}

interface AdminDashboardPageProps {
  stats: DashboardStats
}

export default function AdminDashboardPage(props: AdminDashboardPageProps) {
  const { stats } = props
  const { t, i18n } = useTranslation('admin')

  const statCards = [
    {
      title: t('dashboard.stats.total_users'),
      value: stats.totalUsers,
      icon: (
        <svg className="w-size-8 h-size-8 clr-primary-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      bg: 'bg-primary-100',
      border: 'border-primary-800',
    },
    {
      title: t('dashboard.stats.users_this_month'),
      value: stats.usersThisMonth,
      icon: (
        <svg className="w-size-8 h-size-8 clr-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      bg: 'bg-green-100',
      border: 'border-green-800',
    },
    {
      title: t('dashboard.stats.total_roles'),
      value: stats.totalRoles,
      icon: (
        <svg className="w-size-8 h-size-8 clr-accent-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      bg: 'bg-accent-100',
      border: 'border-accent-800',
    },
    {
      title: t('dashboard.stats.total_permissions'),
      value: stats.totalPermissions,
      icon: (
        <svg className="w-size-8 h-size-8 clr-orange-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      bg: 'bg-orange-100',
      border: 'border-orange-800',
    },
  ]

  return (
    <>
      <Head title={t('dashboard.title')} />
      <AdminMain
        title={t('dashboard.title')}
        icon={
            '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />'
        }
      >
        <div className="grid gap-6">
          <div className="grid-auto-fit gap-4" style={{'--min-item-size': '350px'} as CSSProperties}>
            {statCards.map((card, index) => (
              <div
                key={index}
                className="bg-neutral-000 border-radius-2 padding-6 box-shadow-3 border-solid border-1 border-neutral-200"
              >
                <div className="flex justify-content-space-between align-items-center">
                  <div className="grid">
                    <p className="clr-neutral-600 fw-medium">{card.title}</p>
                    <p className="fs-700 fw-bold clr-neutral-900">{card.value}</p>
                  </div>
                  <div className={`padding-3 border-radius-2 ${card.bg} border-2 border-solid ${card.border}`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid-auto-fit gap-6" style={{'--min-item-size': '410px'} as CSSProperties}>
            <Panel title={t('dashboard.charts.users_by_role')}>
              <div className="grid gap-4">
                {stats.usersByRole.map((item, index) => (
                  <div key={index} className="grid gap-2">
                    <div className="flex-group justify-content-space-between align-items-center">
                      <span className="fs-400 fw-medium clr-neutral-800">{item.role}</span>
                      <span className="fs-400 fw-bold clr-primary-700">{item.count}</span>
                    </div>
                    <div className="w-full bg-neutral-200 border-radius-4" style={{ height: '8px' }}>
                      <div
                        className="bg-primary-700 border-radius-4 transition:width-300"
                        style={{
                          width: `${(item.count / stats.totalUsers) * 100}%`,
                          height: '100%',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title={t('dashboard.recent_users.title')}>
              <div className="grid gap-3">
                {stats.recentUsers.length === 0 ? (
                  <p className="fs-400 clr-neutral-600 text-center padding-6">
                    {t('dashboard.recent_users.no_users')}
                  </p>
                ) : (
                  stats.recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="grid-auto-fit gap-2 justify-content-space-between align-items-center padding-3 border-radius-1 bg-neutral-050 hover:bg-neutral-100 transition:bg-300"
                    >
                      <div className="grid gap-1">
                        <p className="fs-400 fw-semi-bold clr-neutral-900">
                          {user.fullName || t('users.empty.no_name')}
                        </p>
                        <p className="fs-300 clr-neutral-600">{user.email}</p>
                      </div>
                      <div className="grid gap-1 text-right">
                        {user.role !== 'No role' ? (
                          <span className="padding-1 padding-inline-2 bg-accent-100 clr-accent-800 border-1 border-solid border-accent-800 border-radius-1 fs-300 text-center">
                            {user.role}
                          </span>
                        ) : (
                          <span className="padding-1 padding-inline-2 bg-neutral-100 clr-neutral-800 border-1 border-solid border-neutral-800 border-radius-1 fs-300 text-center">{t('users.empty.no_role_assigned')}</span>
                        )}
                        <p className="fs-200 clr-neutral-500">{i18n.format(new Date(user.createdAt!), 'long', i18n.language)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>
        </div>
      </AdminMain>
    </>
  )
}
