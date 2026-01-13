import { ReactNode } from 'react'
import { Heading } from '~/components/elements/heading'

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
    <div className={"grid gap-6 border-radius-2 bg-neutral-000 clr-neutral-800 bg-neutral-100 padding-block-8 box-shadow-5"}>
      {(header || title) && (
        <div className="padding-inline-8 border-solid border-0 border-bottom-1 border-neutral-300 padding-block-end-4">
          {header ? (
            header
          ) : (
            <div>
              {title && <Heading level={3}>{title}</Heading>}
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
