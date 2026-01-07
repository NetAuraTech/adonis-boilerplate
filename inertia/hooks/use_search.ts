import React from 'react'
import { ResourceDefinition } from '~/types/admin'
import { InertiaFormProps } from '@inertiajs/react'
import { UseFormValidationReturn } from '~/hooks/use_form_validation'

interface UseSearchProps {
  resource: ResourceDefinition
  form: InertiaFormProps<any>
  validation: UseFormValidationReturn
}

export function useSearch(props: UseSearchProps) {
  const { resource, form, validation } = props

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = validation.validateAll(form.data)

    if (isValid) {
      form.get(resource.index?.path()!)
    }
  }

  const handleClearForm = () => {
    form.reset()

    form.get(resource.index?.path()!, {
      forceFormData: true,
      preserveState: false,
    })
  }

  return {
    handleSearch,
    handleClearForm,
  }
}
