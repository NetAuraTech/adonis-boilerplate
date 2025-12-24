import { ChangeEvent } from 'react'
import { Label } from './label'
import { Input } from './input'
import { noSanitization, sanitizeEmail, sanitizeText } from '~/helpers/sanitization'

interface InputGroupProps {
  label: string
  name: string
  type: string
  placeholder?: string
  value?: string | number
  checked?: boolean
  options?: Array<{ value: string; label: string }>
  cols?: number
  rows?: number
  disabled?: boolean
  required?: boolean
  errorMessage?: string
  helpText?: string
  helpClassName?: string
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onBlur?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  sanitize?: boolean
}

/**
 * Get appropriate sanitizer based on input type
 */
function getSanitizer(type: string, sanitize: boolean) {
  if (!sanitize) return noSanitization

  switch (type) {
    case 'email':
      return sanitizeEmail
    case 'password':
      return noSanitization
    default:
      return sanitizeText
  }
}

export function InputGroup(props: InputGroupProps) {
  const {
    label,
    name,
    type,
    errorMessage,
    helpText,
    helpClassName,
    onChange,
    onBlur,
    sanitize = true,
    ...inputProps
  } = props

  const isInline = type === 'checkbox' || type === 'radio'
  const sanitizer = getSanitizer(type, sanitize)

  /**
   * Handle change with sanitization
   */
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (type !== 'checkbox' && type !== 'radio' && sanitize) {
      event.target.value = sanitizer(event.target.value)
    }

    onChange?.(event)
  }

  /**
   * Handle blur
   */
  const handleBlur = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (type !== 'checkbox' && type !== 'radio' && sanitize) {
      event.target.value = sanitizer(event.target.value)
    }

    onBlur?.(event)
  }

  return (
    <div className={isInline ? 'display-flex align-items-center gap-2' : 'display-grid gap-2'}>
      {!isInline && <Label label={label} htmlFor={name} required={props.required} />}
      <Input
        {...inputProps}
        name={name}
        type={type}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {isInline && <Label label={label} htmlFor={name} required={props.required} />}
      {errorMessage && <p className="fs-300 clr-red-400 margin-block-start-1">{errorMessage}</p>}
      {helpText && (
        <p className={`fs-300 margin-block-start-1 ${helpClassName || 'clr-neutral-600'}`}>
          {helpText}
        </p>
      )}
    </div>
  )
}
