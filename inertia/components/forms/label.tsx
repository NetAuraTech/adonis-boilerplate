interface LabelProps {
  label: string
  htmlFor: string
  required?: boolean
}

export function Label(props: LabelProps) {
  const { label, htmlFor, required } = props

  return (
    <label
      htmlFor={htmlFor}
      className={`fw-bold fs-400`}
    >
      {label}
      {required && <span className="margin-inline-start-1 clr-red-400">*</span>}
    </label>
  )
}
