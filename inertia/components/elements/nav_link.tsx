import { Link, usePage } from '@inertiajs/react'
import { ReactNode } from 'react'

interface NavLinkProps {
  href: string,
  label: string,
  method?: 'get' | 'post' | 'patch' | 'put' | 'delete'
  fs?: number
  color?: string,
  hover_color?: string,
  current_page_color?: string,
  children?: ReactNode
  onClick?: () => void
}

export function NavLink(props: NavLinkProps) {
  const { href, label, method, fs = 400, color = "neutral-900", hover_color = "primary-400", current_page_color = "accent-400", children, onClick } = props

  const { url } = usePage();
  const isActive = url === href || url.startsWith(`${href}/`);

  return <Link
    href={href}
    method={method}
    aria-current={isActive ? 'page' : undefined}
    className={`fs-${fs} clr-${color} hover:clr-${hover_color} current:clr-${current_page_color}`}
    onClick={onClick}
  >
    {children}
    {label}
  </Link>
}
