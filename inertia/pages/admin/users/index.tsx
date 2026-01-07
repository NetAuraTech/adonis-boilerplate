import { Head, useForm } from '@inertiajs/react'
import { AdminMain } from '~/components/layouts/admin/admin_main'
import { Panel } from '~/components/elements/panel'
import { Pagination } from '~/components/elements/pagination'
import { getAdminResource } from '~/helpers/admin'
import { getCurrentFilters } from '~/helpers/pagination'
import { Button } from '~/components/elements/button'
import { InputGroup } from '~/components/forms/input_group'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'
import Table from '~/components/elements/table'
import { PaginationMeta } from '~/types/pagination'
import { useSearch } from '~/hooks/use_search'
import { useTranslation } from 'react-i18next'
import { StatusEnum, UserStatus } from '~/components/admin/user_status'

interface User {
  id: number
  email: string
  fullName: string | null
  status: StatusEnum
  createdAt: string
  role: {
    id: number
    name: string
    slug: string
  } | null
}

interface AdminUsersIndexProps {
  users: {
    meta: PaginationMeta
    data: User[]
  }
  roles: Array<{
    id: number
    name: string
    slug: string
  }>
  filters: {
    search: string
    role: string
  }
}

export default function AdminUsersIndexPage(props: AdminUsersIndexProps) {
  const { users, roles, filters } = props
  const { t } = useTranslation('admin')

  const resource = getAdminResource('users')

  const form = useForm({search: filters.search, role: filters.role})

  const allowedRoleIds = roles.map(role => String(role.id))

  const validation = useFormValidation({
    search: presets.search,
    role: presets.selectWithOptions(allowedRoleIds, 'role'),
  })

  const { handleSearch, handleClearForm } = useSearch({ form, validation, resource})

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <Head title={resource.index?.label()} />
      <AdminMain
        title={resource.index?.label()}
        icon={resource.icon}
        add_action={resource.create}
      >
        <Panel
          header={
            <form onSubmit={handleSearch} className="display-flex gap-3 align-items-end">
              <InputGroup
                label={t('common.actions.search')}
                name="search"
                value={form.data.search}
                onChange={(event) => {
                  form.setData('search', event.target.value)
                  validation.handleChange('search', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('search', event.target.value)
                }}
                errorMessage={form.errors.search || validation.getValidationMessage('search')}
                placeholder={t('users.search.placeholder')}
                type="text"
                sanitize
              />
              <InputGroup
                label={t('users.fields.role')}
                name="role"
                value={form.data.role}
                onChange={(event) => {
                  form.setData('role', event.target.value)
                  validation.handleChange('role', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('role', event.target.value)
                }}
                errorMessage={form.errors.role || validation.getValidationMessage('role')}
                placeholder={t('users.search.role_placeholder')}
                type="select"
                options={roles.map(role => ({
                  value: String(role.id),
                  label: role.name
                }))}
                sanitize
              />
              <Button
                type="submit"
                variant="primary"
                fitContent
                loading={form.processing}
              >
                {t('common.actions.filter')}
              </Button>
              {(form.data.search || form.data.role) && (
                <Button
                  type="button"
                  onClick={handleClearForm}
                  variant="accent"
                  fitContent
                  loading={form.processing}
                >
                  {t('common.actions.clear')}
                </Button>
              )}
            </form>
          }
          footer={
            <Pagination
              baseUrl={resource.index?.path()!}
              currentPage={users.meta.currentPage}
              lastPage={users.meta.lastPage}
              total={users.meta.total}
              perPage={users.meta.perPage}
              filters={getCurrentFilters(filters)}
            />
          }
        >
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t('users.fields.user')}</Table.HeaderCell>
                <Table.HeaderCell>{t('users.fields.role')}</Table.HeaderCell>
                <Table.HeaderCell>{t('users.fields.status')}</Table.HeaderCell>
                <Table.HeaderCell>{t('users.fields.joined')}</Table.HeaderCell>
                <Table.HeaderCell>{t('users.fields.actions')}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.data.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center">
                    {t('users.empty.no_users')}
                  </Table.Cell>
                </Table.Row>
              ) : (
                users.data.map((user) => (
                    <Table.Row key={`user-${user.id}`}>
                      <Table.Cell>
                        <div>
                          <div className="fw-semi-bold">{user.fullName || t('users.empty.no_name')}</div>
                          <div className="fs-300 clr-neutral-600">{user.email}</div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {user.role ? (
                          <span className="padding-1 padding-inline-2 bg-primary-100 clr-primary-700 border-radius-1 fs-300">
                            {user.role.name}
                          </span>
                        ) : (
                          <span className="clr-neutral-500 fs-300">{t('users.badges.no_role')}</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-3">
                          <UserStatus status={user.status} id={user.id} />
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {formatDate(user.createdAt)}
                      </Table.Cell>
                      <Table.Cell>
                        <Table.Actions
                          resource_id={user.id}
                          resource_label={user.fullName || t('users.empty.no_name')}
                          show_action={resource.show}
                          edit_action={resource.edit}
                          delete_action={resource.delete}
                        />
                      </Table.Cell>
                    </Table.Row>
                  )
                )
              )}
            </Table.Body>
          </Table>
        </Panel>
      </AdminMain>
    </>
  )
}
