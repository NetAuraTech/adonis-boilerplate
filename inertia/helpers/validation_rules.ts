import i18n from 'i18next'

/**
 * Validation rule result
 */
export interface ValidationResult {
  valid: boolean
  message?: string
}

/**
 * Validation rule function
 */
export type ValidationRule = (value: any, fieldName?: string) => ValidationResult

/**
 * Create a validation rule
 */
function createRule(
  validator: (value: any) => boolean,
  messageKey: string,
  messageParams?: (value: any, fieldName?: string) => Record<string, any>
): ValidationRule {
  return (value: any, fieldName?: string) => {
    const valid = validator(value)
    if (valid) {
      return { valid: true }
    }

    const translatedField = fieldName
      ? i18n.t(`validation:fields.${fieldName}`, { defaultValue: fieldName })
      : i18n.t('validation:required', { field: '' })

    const params = messageParams ? messageParams(value, fieldName) : {}

    return {
      valid: false,
      message: i18n.t(`validation:${messageKey}`, {
        ...params,
        field: translatedField,
      }),
    }
  }
}

/**
 * Built-in validation rules
 */
export const rules = {
  /**
   * Required field
   */
  required: (fieldNameKey?: string): ValidationRule =>
    createRule(
      (value) => value !== undefined && value !== null && value !== '',
      'required',
      () => ({ field: fieldNameKey })
    ),

  /**
   * Email format
   */
  email: (): ValidationRule =>
    createRule((value) => {
      if (!value) return true
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    }, 'email'),

  /**
   * Minimum length
   */
  minLength: (min: number, fieldNameKey?: string): ValidationRule =>
    createRule(
      (value) => !value || String(value).length >= min,
      'min_length',
      (value) => ({
        min,
        current: value ? String(value).length : 0,
        field: fieldNameKey,
      })
    ),

  /**
   * Maximum length
   */
  maxLength: (max: number, fieldNameKey?: string): ValidationRule =>
    createRule(
      (value) => !value || String(value).length <= max,
      'max_length',
      (value) => ({
        max,
        current: value ? String(value).length : 0,
        field: fieldNameKey,
      })
    ),

  /**
   * Matches another field (for password confirmation)
   */
  matches: (otherValue: any, otherFieldNameKey: string): ValidationRule =>
    createRule(
      (value) => (!value && !otherValue) || value === otherValue,
      'matches',
      () => ({
        other: i18n.t(`validation:fields.${otherFieldNameKey}`, {
          defaultValue: otherFieldNameKey,
        }),
      })
    ),

  /**
   * Pattern matching (regex)
   */
  pattern: (regex: RegExp, customI18nKey: string): ValidationRule =>
    createRule((value) => !value || regex.test(String(value)), customI18nKey),

  /**
   * Custom validator
   */
  custom: (validator: (value: any) => boolean, i18nKey: string): ValidationRule =>
    createRule(validator, i18nKey),
}

/**
 * Validate a value against multiple rules
 */
export function validate(
  value: any,
  validationRules: ValidationRule[],
  fieldNameKey?: string
): ValidationResult {
  for (const rule of validationRules) {
    const result = rule(value, fieldNameKey)
    if (!result.valid) return result
  }
  return { valid: true }
}

/**
 * Common validation presets
 */
export const presets = {
  email: [rules.required('email'), rules.email()],
  password: [rules.required('password'), rules.minLength(8, 'password')],
  passwordConfirmation: (passwordToMatch: string) => [
    rules.required('password_confirmation'),
    rules.matches(passwordToMatch, 'password'),
  ],
  fullName: [
    rules.required('full_name'),
    rules.minLength(2, 'full_name'),
    rules.maxLength(255, 'full_name'),
  ],
}
