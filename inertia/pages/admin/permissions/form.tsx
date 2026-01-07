import { useForm } from '@inertiajs/react'
import { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminMain } from '~/components/layouts/admin/admin_main'
import { Panel } from '~/components/elements/panel'
import { Button } from '~/components/elements/button'
import { getAdminResource } from '~/helpers/admin'
import { InputGroup } from '~/components/forms/input_group'
import { useFormValidation } from '~/hooks/use_form_validation'
import { rules } from '~/helpers/validation_rules'

interface Permission {
  id: number
  name: string
  slug: string
  category: string
  description: string | null
  isSystem: boolean
  canBeDeleted: boolean
  canBeModified: boolean
}

interface AdminPermissionsFormProps {
  permission: Permission | null
}

export default function AdminPermissionsFormPage(props: AdminPermissionsFormProps) {
  const { permission } = props
  const isEditing = permission !== null
  const { t } = useTranslation('admin')

  const resource = getAdminResource('permissions')

  const form = useForm({
    name: permission?.name || '',
    category: permission?.category || '',
    slug: permission?.slug || '',
    description: permission?.description || '',
  })

  const validation = useFormValidation({
    name: [
      rules.minLength(2, 'name'),
      rules.maxLength(100, 'name'),
      rules.required('name')
    ],
    category: [
      rules.minLength(2, 'category'),
      rules.maxLength(50, 'category'),
      rules.required('category')
    ],
    slug: [
      rules.minLength(2, 'slug'),
      rules.maxLength(100, 'slug'),
      rules.required('slug')
    ],
    description: [
      rules.maxLength(255, 'description')
    ],
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      form.put(resource.update?.path(permission.id)!)
    } else {
      form.post(resource.store?.path()!)
    }
  }

  const pageTitle = isEditing
    ? t('permissions.edit', { name: permission.name })
    : t('permissions.create')
  const submitLabel = isEditing ? t('common.actions.update') : t('common.actions.create')

  return (
    <>
      <AdminMain title={pageTitle} icon={resource.icon}>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <Panel title={t('permissions.details')}>
            <div className="grid gap-4">
              <InputGroup
                label={t('permissions.form.name.label')}
                name="name"
                type="text"
                placeholder={t('permissions.form.name.placeholder')}
                value={form.data.name}
                onChange={(event) => {
                  form.setData('name', event.target.value)
                  validation.handleChange('name', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('name', event.target.value)
                }}
                errorMessage={form.errors.name || validation.getValidationMessage('name')}
                helpText={t('permissions.form.name.help')}
                required
              />
              <InputGroup
                label={t('permissions.form.slug.label')}
                name="slug"
                type="text"
                placeholder={t('permissions.form.slug.placeholder')}
                value={form.data.slug}
                onChange={(event) => {
                  form.setData('slug', event.target.value)
                  validation.handleChange('slug', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('slug', event.target.value)
                }}
                errorMessage={form.errors.slug || validation.getValidationMessage('slug')}
                helpText={t('permissions.form.slug.help')}
                required
              />
              <InputGroup
                label={t('permissions.form.category.label')}
                name="category"
                type="text"
                placeholder={t('permissions.form.category.placeholder')}
                value={form.data.category}
                onChange={(event) => {
                  form.setData('category', event.target.value)
                  validation.handleChange('category', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('category', event.target.value)
                }}
                errorMessage={form.errors.category || validation.getValidationMessage('category')}
                helpText={t('permissions.form.category.help')}
                required
              />
              <InputGroup
                label={t('permissions.form.description.label')}
                name="description"
                type="textarea"
                placeholder={t('permissions.form.description.placeholder')}
                value={form.data.description || ''}
                rows={3}
                onChange={(event) => {
                  form.setData('description', event.target.value)
                  validation.handleChange('description', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('description', event.target.value)
                }}
                errorMessage={form.errors.description || validation.getValidationMessage('description')}
                helpText={t('permissions.form.description.help')}
              />
            </div>
          </Panel>
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
