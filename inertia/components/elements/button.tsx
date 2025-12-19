import { ReactNode } from 'react'
import { Link } from '@inertiajs/react'

interface ButtonProps {
  loading?: boolean
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "accent" | "danger" | "success" | "outline" | "transparent" | "social"
  disabled?: boolean
  children: ReactNode
  onClick?: () => void
  fitContent?: boolean
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
    onClick,
    fitContent = false,
    href,
    external = false
  } = props
  const baseClass = "display-flex align-items-center border-0 border-radius-2 fs-400 justify-content-center padding-block-3 padding-inline-8 fw-bold transition:bg-300 transition:clr-300 cursor-pointer"

  const variantClasses = {
    primary: "bg-primary-400 clr-neutral-1000 hover:bg-primary-500",
    accent: "bg-accent-400 clr-neutral-1000 hover:bg-accent-500",
    danger: "bg-red-400 clr-neutral-1000 hover:bg-red-500",
    success: "bg-green-400 clr-neutral-1000 hover:bg-green-500",
    outline: "bg-transparent border-solid border-2 border-primary-500 clr-neutral-1000 hover:bg-primary-500 hover:clr-neutral-1000",
    transparent: "bg-transparent clr-neutral-700 hover:clr-primary-400",
    social: "bg-neutral-1000 clr-neutral-200 border-solid border-1 border-neutral-200 hover:bg-neutral-800 hover:clr-neutral-000"
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
        <a href={href} className={classes} onClick={onClick}>
          {content}
        </a>
      )
    }

    return (
      <Link href={href} className={classes} onClick={onClick}>
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
    >
      {content}
    </button>
  )
}
