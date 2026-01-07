import { useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { AdminMain } from '~/components/layouts/admin/admin_main'
import { Panel } from '~/components/elements/panel'
import { getAdminResource } from '~/helpers/admin'
import Table from '~/components/elements/table'
import { PaginationMeta } from '~/types/pagination'
import { Pagination } from '~/components/elements/pagination'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'
import { InputGroup } from '~/components/forms/input_group'
import { Button } from '~/components/elements/button'
import { useSearch } from '~/hooks/use_search'

interface Permission {
  id: number
  name: string
  slug: string
  description: string
  category: string
  canBeDeleted: boolean
  canBeModified: boolean
}

interface AdminPermissionsIndexProps {
  permissions: {
    meta: PaginationMeta
    data: Permission[]
  },
  categories: string[],
  filters: {
    search: string
    category: string
  }
}

export default function AdminPermissionsIndexPage(props: AdminPermissionsIndexProps) {
  const { permissions, categories, filters } = props
  const { t } = useTranslation('admin')

  const resource = getAdminResource('permissions')

  const form = useForm({search: filters.search, category: filters.category})

  const validation = useFormValidation({
    search: presets.search,
    category: presets.selectWithOptions(categories, 'category'),
  })

  const { handleSearch, handleClearForm } = useSearch({ form, validation, resource})

  return (
    <>
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
                placeholder={t('permissions.search.placeholder')}
                type="text"
                sanitize
              />
              <InputGroup
                label={t('permissions.fields.category')}
                name="role"
                value={form.data.category}
                onChange={(event) => {
                  form.setData('category', event.target.value)
                  validation.handleChange('category', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('category', event.target.value)
                }}
                errorMessage={form.errors.category || validation.getValidationMessage('category')}
                placeholder={t('permissions.search.category_placeholder')}
                type="select"
                options={categories.map(category => ({
                  value: category,
                  label: category
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
              {(form.data.search || form.data.category) && (
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
              currentPage={permissions.meta.currentPage}
              lastPage={permissions.meta.lastPage}
              total={permissions.meta.total}
              perPage={permissions.meta.perPage}
            />
          }
        >
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t('permissions.fields.name')}</Table.HeaderCell>
                <Table.HeaderCell>{t('permissions.fields.slug')}</Table.HeaderCell>
                <Table.HeaderCell>{t('permissions.fields.description')}</Table.HeaderCell>
                <Table.HeaderCell>{t('permissions.fields.category')}</Table.HeaderCell>
                <Table.HeaderCell>{t('permissions.fields.actions')}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {permissions.data.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center">
                    {t('permissions.empty.no_permissions')}
                  </Table.Cell>
                </Table.Row>
              ) : (
                permissions.data.map((permission) => (
                    <Table.Row key={`user-${permission.id}`}>
                      <Table.Cell>
                        <span>{permission.name}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span>{permission.slug}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span>{permission.description}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span>{permission.category}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Table.Actions
                          resource_id={permission.id}
                          resource_label={permission.name}
                          show_action={resource.show}
                          edit_action={resource.edit}
                          delete_action={resource.delete}
                          can_edit_action={permission.canBeModified}
                          can_delete_action={permission.canBeDeleted}
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
