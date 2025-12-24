import { useState, useCallback } from 'react'
import { validate, type ValidationRule, type ValidationResult } from '~/helpers/validation_rules'

/**
 * Field validation state
 */
export interface FieldState {
  /**
   * Field has been touched (onBlur triggered)
   */
  touched: boolean

  /**
   * Field is currently being typed in
   */
  typing: boolean

  /**
   * Validation result
   */
  validation: ValidationResult

  /**
   * Visual state for UI
   */
  status: 'pristine' | 'valid' | 'invalid'
}

/**
 * Form validation config
 */
export interface FormValidationConfig {
  [fieldName: string]: ValidationRule[]
}

/**
 * Form validation hook
 */
export function useFormValidation(config: FormValidationConfig) {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>(() => {
    const initial: Record<string, FieldState> = {}
    Object.keys(config).forEach((field) => {
      initial[field] = {
        touched: false,
        typing: false,
        validation: { valid: true },
        status: 'pristine',
      }
    })
    return initial
  })

  /**
   * Get field state
   */
  const getFieldState = useCallback(
    (fieldName: string): FieldState => {
      return (
        fieldStates[fieldName] || {
          touched: false,
          typing: false,
          validation: { valid: true },
          status: 'pristine',
        }
      )
    },
    [fieldStates]
  )

  /**
   * Validate a specific field
   */
  const validateField = useCallback(
    (fieldName: string, value: any): ValidationResult => {
      const rules = config[fieldName]
      if (!rules) {
        return { valid: true }
      }
      return validate(value, rules, fieldName)
    },
    [config]
  )

  /**
   * Handle field change (typing)
   */
  const handleChange = useCallback(
    (fieldName: string, value: any) => {
      const validation = validateField(fieldName, value)

      setFieldStates((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          typing: true,
          validation,
          status: prev[fieldName].touched
            ? validation.valid
              ? 'valid'
              : 'invalid'
            : validation.valid
              ? 'valid'
              : 'pristine',
        },
      }))
    },
    [validateField]
  )

  /**
   * Handle field blur (user left the field)
   */
  const handleBlur = useCallback(
    (fieldName: string, value: any) => {
      const validation = validateField(fieldName, value)

      setFieldStates((prev) => ({
        ...prev,
        [fieldName]: {
          touched: true,
          typing: false,
          validation,
          status: validation.valid ? 'valid' : 'invalid',
        },
      }))
    },
    [validateField]
  )

  /**
   * Validate all fields
   */
  const validateAll = useCallback(
    (values: Record<string, any>): boolean => {
      let allValid = true
      const newStates: Record<string, FieldState> = {}

      Object.keys(config).forEach((fieldName) => {
        const value = values[fieldName]
        const validation = validateField(fieldName, value)

        newStates[fieldName] = {
          touched: true,
          typing: false,
          validation,
          status: validation.valid ? 'valid' : 'invalid',
        }

        if (!validation.valid) {
          allValid = false
        }
      })

      setFieldStates(newStates)
      return allValid
    },
    [config, validateField]
  )

  /**
   * Reset validation states
   */
  const reset = useCallback(() => {
    const resetStates: Record<string, FieldState> = {}
    Object.keys(config).forEach((field) => {
      resetStates[field] = {
        touched: false,
        typing: false,
        validation: { valid: true },
        status: 'pristine',
      }
    })
    setFieldStates(resetStates)
  }, [config])

  /**
   * Get validation message for a field
   */
  const getValidationMessage = useCallback(
    (fieldName: string): string | undefined => {
      const state = getFieldState(fieldName)
      if (state.touched && !state.validation.valid) {
        return state.validation.message
      }
      return undefined
    },
    [getFieldState]
  )

  /**
   * Get help text class based on validation state
   */
  const getHelpClassName = useCallback(
    (fieldName: string): string => {
      const state = getFieldState(fieldName)
      if (state.status === 'valid') return 'clr-green-500'
      if (state.status === 'invalid') return 'clr-red-400'
      return ''
    },
    [getFieldState]
  )

  return {
    fieldStates,
    getFieldState,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    getValidationMessage,
    getHelpClassName,
  }
}
