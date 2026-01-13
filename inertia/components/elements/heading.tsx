import { ReactNode, ElementType } from 'react'

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
  children: ReactNode
}

export function Heading(props: HeadingProps) {
  const { level, className, children } = props

  const Tag = `h${level}` as ElementType

  return (
    <Tag className={`heading-${level} ${className}`}>
      {children}
    </Tag>
  )
}
