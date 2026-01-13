import { ReactNode } from 'react'
import { Heading } from '~/components/elements/heading'

interface BannerProps {
  type: 'success' | 'error' | 'info' | 'warning'
  title: string | ReactNode
  message: string | ReactNode
  children?: ReactNode
}

export function Banner(props: BannerProps) {
  const { type, title, message, children } = props

  const config = {
    success: {
      bg: 'bg-green-200',
      clr: 'clr-green-800',
      border: 'border-green-800',
    },
    error: {
      bg: 'bg-red-200',
      clr: 'clr-red-800',
      border: 'border-red-800',
    },
    warning: {
      bg: 'bg-orange-200',
      clr: 'clr-orange-800',
      border: 'border-orange-800',
    },
    info: {
      bg: 'bg-blue-200',
      clr: 'clr-blue-800',
      border: 'border-blue-800',
    },
  }

  return <div
    className={`grid gap-2 ${config[type].bg} ${config[type].border} border-solid border-2 padding-4 border-radius-2 margin-block-start-3`}
  >
    <Heading level={4} className={`${config[type].clr}`}>
      {
        title
      }
    </Heading>
    <p className={`fs-300 ${config[type].clr}`} style={{ margin: 0 }}>
      {
        message
      }
    </p>
    {
      children
    }
  </div>
}
