import { Label } from '#components/forms/label'
import { Input } from '#components/forms/input'
import { ChangeEvent } from 'react'

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
}

export function InputGroup(props: InputGroupProps) {
  const { label, name, type, errorMessage, helpText, helpClassName = "clr-neutral-700", ...inputProps } = props

  const helpId = `${name}-help`

  if (type === 'checkbox' || type === 'radio') {
    return (
      <div className="form-group mb-4">
        <div className="flex items-center gap-2">
          <Input
            name={name}
            type={type}
            {...inputProps}
            aria-describedby={helpText ? helpId : undefined}
          />
          <Label label={label} htmlFor={name} required={props.required} />
        </div>
        {helpText && <p id={helpId} className={helpClassName}>{helpText}</p>}
        {errorMessage && <p className="clr-red-300">{errorMessage}</p>}
      </div>
    )
  }

  return (
    <div className="display-grid gap-2">
      <Label label={label} htmlFor={name} required={props.required} />
      <Input
        name={name}
        type={type}
        {...inputProps}
        aria-describedby={helpText ? helpId : undefined}
      />
      {helpText && <p id={helpId} className={helpClassName}>{helpText}</p>}
      {errorMessage && <p className="clr-red-300">{errorMessage}</p>}
    </div>
  )
}
