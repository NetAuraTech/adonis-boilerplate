import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function AppShell({ children }: Props) {
  return <div>
    <h1>Hello, world !</h1>
    {children}
  </div>
}
