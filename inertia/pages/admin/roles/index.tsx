import { Head } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { AdminMain } from '~/components/layouts/admin/admin_main'
import { Panel } from '~/components/elements/panel'
import { getAdminResource } from '~/helpers/admin'
import Table from '~/components/elements/table'
import { PaginationMeta } from '~/types/pagination'
import { Pagination } from '~/components/elements/pagination'

interface Role {
  id: number
  name: string
  slug: string
  description: string
  usersCount: number
  canBeDeleted: boolean
  canBeModified: boolean
}

interface AdminRolesIndexProps {
  roles: {
    meta: PaginationMeta
    data: Role[]
  }
}

export default function AdminRolesIndexPage(props: AdminRolesIndexProps) {
  const { roles } = props
  const { t } = useTranslation('admin')

  const resource = getAdminResource('roles')

  return (
    <>
      <Head title={resource.index?.label()} />
      <AdminMain
        title={resource.index?.label()}
        icon={resource.icon}
        add_action={resource.create}
      >
        <Panel
          footer={
            <Pagination
              baseUrl={resource.index?.path()!}
              currentPage={roles.meta.currentPage}
              lastPage={roles.meta.lastPage}
              total={roles.meta.total}
              perPage={roles.meta.perPage}
            />
          }
        >
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t('roles.fields.name')}</Table.HeaderCell>
                <Table.HeaderCell>{t('roles.fields.description')}</Table.HeaderCell>
                <Table.HeaderCell>{t('roles.fields.users_count')}</Table.HeaderCell>
                <Table.HeaderCell>{t('roles.fields.actions')}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {roles.data.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center">
                    {t('roles.empty.no_roles')}
                  </Table.Cell>
                </Table.Row>
              ) : (
                roles.data.map((role) => (
                    <Table.Row key={`user-${role.id}`}>
                      <Table.Cell data-label={t('roles.fields.name')}>
                        <span>{role.name}</span>
                      </Table.Cell>
                      <Table.Cell data-label={t('roles.fields.description')}>
                        <span>{role.description}</span>
                      </Table.Cell>
                      <Table.Cell data-label={t('roles.fields.users_count')}>
                        <span>{role.usersCount}</span>
                      </Table.Cell>
                      <Table.Cell data-label={t('roles.fields.actions')}>
                        <Table.Actions
                          resource_id={role.id}
                          resource_label={role.name}
                          show_action={resource.show}
                          edit_action={resource.edit}
                          delete_action={resource.delete}
                          can_edit_action={role.canBeModified}
                          can_delete_action={role.canBeDeleted}
                        />
                      </Table.Cell>
                    </Table.Row>
                  )
                )
              )
              }
            </Table.Body>
          </Table>
        </Panel>
      </AdminMain>
    </>
  )
}
