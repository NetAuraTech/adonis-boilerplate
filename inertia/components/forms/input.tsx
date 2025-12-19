import { ChangeEvent } from 'react'

interface InputProps {
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
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

export function Input(props: InputProps) {
  const { name, type, placeholder, value, checked, options, cols, rows, disabled, required, onChange, ...inputProps } = props

  const baseInputClass = "bg-neutral-100 clr-neutral-800 fs-400 padding-2 border-radius-2 border-1 border-solid border-neutral-300 focus:border-primary-400"

  const checkableClass = "cursor-pointer border-1 border-solid border-neutral-400 accent-accent-500 focus:border-accent-500"

  switch (type) {
    case 'textarea':
      return (
        <textarea
          name={name}
          id={name}
          cols={cols}
          rows={rows || 4}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          required={required}
          onChange={onChange as (e: ChangeEvent<HTMLTextAreaElement>) => void}
          className={baseInputClass}
          {...inputProps}
        />
      )

    case 'select':
      return (
        <select
          name={name}
          id={name}
          value={value}
          disabled={disabled}
          required={required}
          onChange={onChange as (e: ChangeEvent<HTMLSelectElement>) => void}
          className={`${baseInputClass} cursor-pointer`}
          {...inputProps}
        >
          <option value="">{placeholder || 'Sélectionnez une option'}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )

    case 'checkbox':
      return (
        <input
          type="checkbox"
          name={name}
          id={name}
          checked={checked}
          disabled={disabled}
          required={required}
          onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
          className={`${checkableClass} border-radius-1`}
          style={{ width: '1.25rem', height: '1.25rem' }}
          {...inputProps}
        />
      )

    case 'radio':
      return (
        <input
          type="radio"
          name={name}
          id={name}
          value={value}
          checked={checked}
          disabled={disabled}
          required={required}
          onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
          className={checkableClass}
          style={{ width: '1.25rem', height: '1.25rem' }}
          {...inputProps}
        />
      )

    case 'file':
      return (
        <input
          type="file"
          name={name}
          id={name}
          disabled={disabled}
          required={required}
          onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
          className="fs-300 clr-neutral-600 cursor-pointer
                     file:margin-inline-end-4 file:padding-block-2 file:padding-inline-4
                     file:border-radius-2 file:border-none
                     file:bg-primary-100 file:clr-primary-700
                     file:fs-400 file:font-bold
                     hover:file:bg-primary-200"
          {...inputProps}
        />
      )

    default:
      return (
        <input
          type={type}
          name={name}
          id={name}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          required={required}
          onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
          className={baseInputClass}
          {...inputProps}
        />
      )
  }
}
