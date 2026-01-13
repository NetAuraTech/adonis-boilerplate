import { ReactNode } from 'react'

interface AuthIntroProps {
  title: string,
  text: string,
  icon: ReactNode
}


export function AuthIntro(props: AuthIntroProps) {
  const { title, text, icon } = props


  return <div className="text-center padding-block-8">
    <div className="display-inline-flex align-items-center justify-content-center bg-primary-300 clr-neutral-900 border-radius-4 padding-4 margin-block-end-4">
      <svg
        className="w-size-10 h-size-10"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {
          icon
        }
      </svg>
    </div>
    <h1 className="heading-1">{title}</h1>
    <p className="clr-neutral-600">{text}</p>
  </div>
}
