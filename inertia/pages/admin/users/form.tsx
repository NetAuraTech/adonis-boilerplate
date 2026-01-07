import { useForm } from '@inertiajs/react'
import { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminMain } from '~/components/layouts/admin/admin_main'
import { Panel } from '~/components/elements/panel'
import { Button } from '~/components/elements/button'
import { getAdminResource } from '~/helpers/admin'
import { InputGroup } from '~/components/forms/input_group'

interface Role {
  id: number
  name: string
  slug: string
}

interface User {
  id: number
  email: string
  fullName: string
  role?: Role
}

interface AdminUsersFormProps {
  user: User | null
  roles: Role[]
}

export default function AdminUsersFormPage(props: AdminUsersFormProps) {
  const { roles, user } = props
  const isEditing = user !== null
  const { t } = useTranslation('admin')

  const resource = getAdminResource('users')

  const form = useForm({
    email: user?.email || '',
    fullName: user?.fullName || '',
    role_id: user?.role?.id || null,
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      form.put(resource.update?.path(user.id)!)
    } else {
      form.post(resource.store?.path()!)
    }
  }

  const roleOptions = [
    { value: '', label: t('users.form.role.no_role') },
    ...roles.map((role) => ({
      value: String(role.id),
      label: role.name,
    })),
  ]

  const pageTitle = isEditing
    ? t('users.edit', { name: user.fullName || t('users.empty.no_name') })
    : t('users.create')
  const submitLabel = isEditing ? t('common.actions.update') : t('common.actions.create')

  return (
    <>
      <AdminMain title={pageTitle} icon={resource.icon}>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <Panel
            title={isEditing ? '' : t('users.invitation_details')}
            subtitle={isEditing ? '' : t('users.invitation_subtitle')}
          >
            <div className="grid gap-4">
              <InputGroup
                label={t('users.form.email.label')}
                name="email"
                type="email"
                placeholder={t('users.form.email.placeholder')}
                value={form.data.email}
                onChange={(e) => form.setData('email', e.target.value)}
                errorMessage={form.errors.email}
                helpText={isEditing ? '' : t('users.form.email.help')}
                required
              />

              <InputGroup
                label={t('users.form.full_name.label')}
                name="fullName"
                type="text"
                placeholder={t('users.form.full_name.placeholder')}
                value={form.data.fullName}
                onChange={(e) => form.setData('fullName', e.target.value)}
                errorMessage={form.errors.fullName}
                helpText={isEditing ? '' : t('users.form.full_name.help')}
              />

              <InputGroup
                label={t('users.form.role.label')}
                name="role_id"
                type="select"
                value={form.data.role_id || ''}
                options={roleOptions}
                onChange={(e) =>
                  form.setData('role_id', e.target.value ? Number(e.target.value) : null)
                }
                errorMessage={form.errors.role_id}
                helpText={isEditing ? '' : t('users.form.role.help')}
              />
            </div>
          </Panel>
          {
            !isEditing && <div className="padding-4 bg-blue-200 border-1 border-solid border-blue-300 border-radius-2">
              <div className="flex-group gap-2 align-items-start">
                <svg
                  className="w-3 h-3 clr-blue-700 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="fs-400 fw-semi-bold clr-blue-800">
                    {t('users.invitation_info.title')}
                  </p>
                  <ul className="fs-300 clr-blue-700 margin-block-start-2 padding-inline-start-4">
                    {(t('users.invitation_info.steps', { returnObjects: true }) as Array<string>).map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          }
          <div className="flex-group justify-content-flex-end gap-3">
            <Button
              type="button"
              variant="outline"
              href={resource.index?.path()}
              fitContent
            >
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={form.processing} fitContent>
              {submitLabel}
            </Button>
          </div>
        </form>
      </AdminMain>
    </>
  )
}
