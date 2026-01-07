import { ResourceDefinition } from '~/types/admin'
import { Button } from '~/components/elements/button'
import { router } from '@inertiajs/react'

interface ResourceItem {
  id: number
  name: string
  canBeModified: boolean
  canBeDeleted: boolean
}

interface AdminShowNavProps {
  resource: ResourceDefinition,
  item: ResourceItem
}

export function AdminShowNav(props: AdminShowNavProps) {
  const { resource, item } = props

  const handleDelete = () => {
    if (confirm(resource.delete?.confirm_message)) {
      router.delete(resource.delete?.path(item.id)!)
    }
  }

  return <div className="flex justify-content-space-between gap-3">
    <Button
      type="button"
      variant="transparent"
      href={resource.index?.path()}
      fitContent
      padding="padding-0"
      title="Back to List"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        className="margin-inline-end-2 w-3 h-3"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </Button>
    <div className="flex gap-3">
      {item.canBeModified && (
        <Button
          variant="icon"
          href={resource.edit?.path(item.id)}
          title={resource.edit?.label(item.name)}
          fitContent
          padding="padding-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="w-3 h-3 clr-neutral-800 hover:clr-primary-400 transition:clr-300"
            viewBox="0 0 24 24"
          >
            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
          </svg>
        </Button>
      )}
      {item.canBeDeleted && (
        <Button
          type="button"
          variant="icon"
          onClick={handleDelete}
          title={resource.delete?.label(item.name)}
          fitContent
          padding="padding-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="w-3 h-3 clr-red-300 hover:clr-red-500 transition:clr-300"
            viewBox="0 0 24 24"
          >
            <path d="M10 11v6M14 11v6M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </Button>
      )}
    </div>
  </div>
}
