import { ReactNode } from 'react'
import { Link } from '@inertiajs/react'

interface ButtonProps {
  loading?: boolean
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "accent" | "danger" | "success" | "outline" | "transparent" | "icon" | "social"
  disabled?: boolean
  children: ReactNode
  title?: string
  onClick?: () => void
  fitContent?: boolean
  padding?: string
  href?: string
  external?: boolean
}

export function Button(props: ButtonProps) {
  const {
    loading,
    type = "submit",
    variant = "primary",
    disabled = false,
    children,
    title,
    onClick,
    fitContent = false,
    padding = "padding-block-3 padding-inline-8",
    href,
    external = false
  } = props
  const baseClass = `display-flex align-items-center fs-400 ${padding} justify-content-center fw-bold transition:bg-300 transition:clr-300 cursor-pointer`

  const variantClasses = {
    primary: "border-0 border-radius-2 bg-primary-700 clr-neutral-100 hover:clr-neutral-100 hover:bg-primary-800 box-shadow-1",
    accent: "border-0 border-radius-2 bg-accent-700 clr-neutral-100 hover:clr-neutral-100 hover:bg-accent-800 box-shadow-1",
    danger: "border-0 border-radius-2 bg-red-400 clr-neutral-1000 hover:clr-neutral-1000 hover:bg-red-500 box-shadow-1",
    success: "border-0 border-radius-2 bg-green-400 clr-neutral-1000 hover:clr-neutral-1000 hover:bg-green-500 box-shadow-1",
    outline: "border-2 border-radius-2 bg-transparent border-solid border-primary-800 clr-neutral-1000 hover:bg-primary-500 hover:clr-neutral-1000 box-shadow-1",
    transparent: "border-0 border-radius-2 bg-transparent clr-neutral-700 hover:clr-accent-800",
    icon: "bg-transparent clr-neutral-700 hover:clr-primary-700",
    social: "border-0 border-radius-2 bg-neutral-100 clr-neutral-800 border-solid border-1 border-neutral-200 hover:clr-neutral-800 hover:border-primary-700 transition:border-300 box-shadow-1"
  }

  const classes = `
    ${baseClass}
    ${variantClasses[variant]}
    ${fitContent ? "w-fit" : "w-full"}
    ${(disabled || loading) ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
  `.trim()

  const content = (
    <>
      {loading && (
        <svg
          className="margin-inline-end-2 h-size-4 w-size-4 animation:spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </>
  )

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          onClick={onClick}
          title={title}
        >
          {content}
        </a>
      )
    }

    return (
      <Link
        href={href}
        className={classes}
        onClick={onClick}
        title={title}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      disabled={loading || disabled}
      type={type}
      onClick={onClick}
      className={classes}
      title={title}
    >
      {content}
    </button>
  )
}
