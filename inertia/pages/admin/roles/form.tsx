import { useForm } from '@inertiajs/react'
import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminMain } from '~/components/layouts/admin/admin_main'
import { Panel } from '~/components/elements/panel'
import { Button } from '~/components/elements/button'
import { getAdminResource } from '~/helpers/admin'
import { InputGroup } from '~/components/forms/input_group'
import { useFormValidation } from '~/hooks/use_form_validation'
import { rules } from '~/helpers/validation_rules'
import { AdminForm } from '~/components/admin/admin_form'

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

interface AdminRolesFormProps {
  role: Role | null
  permissionsByCategory: Record<string, Permission[]>
}

export default function AdminRolesFormPage(props: AdminRolesFormProps) {
  const { role, permissionsByCategory } = props
  const isEditing = role !== null
  const { t } = useTranslation('admin')

  const resource = getAdminResource('roles')

  const initialPermissionIds: number[] = []
  if (isEditing && permissionsByCategory) {
    Object.values(permissionsByCategory).forEach((permissions) => {
      permissions.forEach((permission) => {
        if (permission.assigned) {
          initialPermissionIds.push(permission.id)
        }
      })
    })
  }

  const form = useForm({
    name: role?.name || '',
    description: role?.description || '',
    permission_ids: initialPermissionIds,
  })

  const validation = useFormValidation({
    name: [
      rules.maxLength(50, 'name'),
      rules.required('name')
    ],
    description: [
      rules.maxLength(255, 'description')
    ],
  })

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    Object.keys(permissionsByCategory).forEach((category) => {
      initial[category] = true
    })
    return initial
  })

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const handlePermissionToggle = (permissionId: number) => {
    const currentIds = form.data.permission_ids
    if (currentIds.includes(permissionId)) {
      form.setData('permission_ids', currentIds.filter((id) => id !== permissionId))
    } else {
      form.setData('permission_ids', [...currentIds, permissionId])
    }
  }

  const selectAllInCategory = (permissions: Permission[]) => {
    const categoryPermissionIds = permissions.map((p) => p.id)
    const allSelected = categoryPermissionIds.every((id) =>
      form.data.permission_ids.includes(id)
    )

    if (allSelected) {
      form.setData(
        'permission_ids',
        form.data.permission_ids.filter((id) => !categoryPermissionIds.includes(id))
      )
    } else {
      const newIds = [...new Set([...form.data.permission_ids, ...categoryPermissionIds])]
      form.setData('permission_ids', newIds)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      form.put(resource.update?.path(role.id)!)
    } else {
      form.post(resource.store?.path()!)
    }
  }

  const pageTitle = isEditing ? resource.edit?.label(role.name) : resource.create?.label()

  return (
    <>
      <AdminMain title={pageTitle} icon={resource.icon}>
        <AdminForm
          form={form}
          resource={resource}
          isEditing={isEditing}
          onSubmit={handleSubmit}
        >
          <Panel
            title={t('roles.basic_info')}
          >
            <div className="grid gap-4">
              <InputGroup
                label={t('roles.form.name.label')}
                name="name"
                type="text"
                placeholder={t('roles.form.name.placeholder')}
                value={form.data.name}
                onChange={(event) => {
                  form.setData('name', event.target.value)
                  validation.handleChange('name', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('name', event.target.value)
                }}
                errorMessage={form.errors.name || validation.getValidationMessage('name')}
                required
              />
              <InputGroup
                label={t('roles.form.description.label')}
                name="description"
                type="textarea"
                placeholder={t('roles.form.description.placeholder')}
                value={form.data.description || ''}
                rows={3}
                onChange={(event) => {
                  form.setData('description', event.target.value)
                  validation.handleChange('description', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('description', event.target.value)
                }}
                errorMessage={form.errors.name || validation.getValidationMessage('description')}
              />
            </div>
          </Panel>
          <Panel
            header={
              <div className="flex-group justify-content-space-between align-items-center">
                <h3 className="heading-3">{t('roles.permissions_section')}</h3>
                <p className="fs-300 clr-neutral-600">
                  {t('roles.permissions.selected_count', { count: form.data.permission_ids.length })}
                </p>
              </div>
            }
          >
            <div className="grid gap-4">
              {form.errors.permission_ids && (
                <p className="fs-300 clr-red-400">{form.errors.permission_ids}</p>
              )}
              <div className="grid gap-4">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                  const isExpanded = expandedCategories[category]
                  const categoryPermissionIds = permissions.map((p) => p.id)
                  const selectedInCategory = categoryPermissionIds.filter((id) =>
                    form.data.permission_ids.includes(id)
                  ).length
                  const allSelected = selectedInCategory === categoryPermissionIds.length

                  return (
                    <div
                      key={category}
                      className="border-1 border-solid border-neutral-300 border-radius-2 overflow-hidden"
                    >
                      <div className="w-full bg-neutral-100 border-radius-2 padding-block-4 flex-group justify-content-space-between align-items-center text-left hover:bg-neutral-150 transition:bg-300">
                        <Button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          variant="transparent"
                          fitContent
                        >
                          <svg
                            className={`w-3 h-3 transition:all-300 ${
                              isExpanded ? 'rotate-90 margin-inline-end-1' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="fw-semi-bold fs-400">{category}</span>
                          <span className="fs-300 clr-neutral-600 margin-inline-start-1">
                              {t('roles.permissions.category_count', { selected: selectedInCategory, total: permissions.length })}
                            </span>
                        </Button>

                        <Button
                          type="button"
                          onClick={() => selectAllInCategory(permissions)}
                          variant="transparent"
                          fitContent
                        >
                          {allSelected ? t('roles.permissions.deselect_all') : t('roles.permissions.select_all')}
                        </Button>
                      </div>
                      {isExpanded && (
                        <div className="padding-4 grid gap-3">
                          {permissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="display-flex align-items-center gap-3 padding-3 border-radius-1 hover:bg-neutral-050 cursor-pointer transition:bg-300"
                            >
                              <input
                                type="checkbox"
                                checked={form.data.permission_ids.includes(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                                className="cursor-pointer border-1 border-solid border-neutral-400 accent-accent-500 focus:border-accent-500 border-radius-1"
                                style={{ width: '1.25rem', height: '1.25rem' }}
                              />
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
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Panel>
        </AdminForm>
      </AdminMain>
    </>
  )
}
