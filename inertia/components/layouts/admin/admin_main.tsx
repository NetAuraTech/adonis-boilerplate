import { Button } from '~/components/elements/button'
import { Head } from '@inertiajs/react'
import { ResourceAction } from '~/types/admin'
import { CanAccess } from '~/components/auth/can_access'

interface AdminMainProps {
  title?: string
  icon?: string
  add_action?: ResourceAction
  children: React.ReactNode
}

export function AdminMain(props: AdminMainProps) {
  const { title, icon, add_action, children } = props

  return (
    <section className="grid gap-4">
      <Head title={title} />
      <div className="flex-group justify-content-space-between align-items-center w-full">
        <h2 className="heading-2 flex-group align-items-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            dangerouslySetInnerHTML={{ __html: icon ?? '' }}
            className="w-4 h-4"
          />
          {title}
        </h2>
        <CanAccess permission={add_action?.permission}>
          {add_action &&  (
            <Button href={add_action.path()} fitContent>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                className="margin-inline-end-2 w-3 h-3"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8M12 8v8" />
              </svg>
              {add_action.label()}
            </Button>
          )}
        </CanAccess>
      </div>
      {children}
    </section>
  )
}
