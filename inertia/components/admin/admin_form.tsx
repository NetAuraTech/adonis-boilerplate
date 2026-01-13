import { FormEvent, ReactNode } from 'react'
import { ResourceDefinition } from '~/types/admin'
import { Button } from '~/components/elements/button'
import { useTranslation } from 'react-i18next'
import { InertiaFormProps } from '@inertiajs/react'

interface AdminFormProps {
  resource: ResourceDefinition,
  onSubmit: (e: FormEvent) => void
  isEditing: boolean
  form: InertiaFormProps<any>
  children?: ReactNode
}

export function AdminForm(props: AdminFormProps) {
  const { resource, onSubmit, form, isEditing, children } = props

  const { t } = useTranslation('admin')

  const submitLabel = isEditing ? t('common.actions.update') : t('common.actions.create')

  return <form onSubmit={onSubmit} className="grid gap-6">
    {
      children
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
}
