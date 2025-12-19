import { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  title?: string
  subtitle?: string
  variant?: "default" | "bordered" | "flat" | "elevated"
  padding?: "none" | "sm" | "md" | "lg"
  header?: ReactNode
  footer?: ReactNode
}

export function Panel(props: PanelProps) {
  const {
    children,
    title,
    subtitle,
    header,
    footer,
  } = props

  return (
    <div className={"grid gap-6 border-radius-2 bg-neutral-000 clr-neutral-800 padding-block-8 box-shadow-1"}>
      {(header || title) && (
        <div className="padding-inline-8 border-solid border-0 border-bottom-1 border-neutral-300 padding-block-end-4">
          {header ? (
            header
          ) : (
            <div>
              {title && <h3 className="heading-3">{title}</h3>}
              {subtitle && <p className="fs-400 clr-neutral-600">{subtitle}</p>}
            </div>
          )}
        </div>
      )}
      <div className="padding-inline-8">
        {children}
      </div>
      {footer && (
        <div className="padding-inline-8 border-solid border-0 border-top-1 border-neutral-300 padding-block-start-8">
          {footer}
        </div>
      )}
    </div>
  )
}
