import { ResourceAction, ResourceActionWithParams } from '~/types/admin'
import { router } from '@inertiajs/react'
import { Button } from '~/components/elements/button'
import { CanAccess } from '~/components/auth/can_access'

interface Props {
  children: React.ReactNode
}

interface CellProps {
  colSpan?: number
  className?: string
  children: React.ReactNode
}

interface ActionsProps {
  resource_id: number
  resource_label?: string
  show_action?: ResourceActionWithParams
  create_action?: ResourceAction
  edit_action?: ResourceActionWithParams
  delete_action?: ResourceActionWithParams
  can_show_action?: boolean
  can_create_action?: boolean
  can_edit_action?: boolean
  can_delete_action?: boolean
  children?: React.ReactNode
}
const Table = (props: Props) => {
  const { children } = props

  return (
    <table className="table">
      {children}
    </table>
  )
};

const Header = (props: Props) => {
  const { children } = props

  return (
    <thead>
      {children}
    </thead>
  )
}

const Row = (props: Props) => {
  const { children } = props

  return (
    <tr>
      {children}
    </tr>
  )
}

const HeaderCell = (props: Props) => {
  const { children } = props

  return (
    <th>
      {children}
    </th>
  )
}

const Cell = (props: CellProps) => {
  const { children } = props

  return (
    <td {...props}>
      {children}
    </td>
  )
}

const Body = (props: Props) => {
  const { children } = props

  return (
    <tbody>{children}</tbody>
  )
}

const Actions = (props: ActionsProps) => {
  const { resource_id,
    resource_label,
    show_action,
    create_action,
    edit_action,
    delete_action,
    can_show_action = true,
    can_create_action = true,
    can_edit_action = true,
    can_delete_action = true,
    children
  } = props

  const handleDelete = () => {
    if (confirm(`${delete_action?.confirm_message!}`)) {
      router.delete(`${delete_action?.path(resource_id)!}`)
    }
  }

  return (
    <div className="flex-group align-items-center w-full padding-block-4">
      <CanAccess permission={show_action?.permission}>
        {show_action && (
          <Button
            fitContent
            padding="padding-0"
            variant="icon"
            title={show_action.label(resource_label)}
            href={`${show_action?.path(resource_id)!}`}
            disabled={!show_action.can(can_show_action)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-3 h-3 clr-neutral-800 hover:clr-primary-700 transition:clr-300"
              viewBox="0 0 24 24"
            >
              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Button>
        )}
      </CanAccess>
      <CanAccess permission={create_action?.permission}>
        {create_action && (
          <Button
            fitContent
            padding="padding-0"
            variant="icon"
            title={create_action.label()}
            href={`${create_action?.path()!}`}
            disabled={!create_action.can(can_create_action)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-3 h-3 clr-neutral-800 hover:clr-primary-700 transition:clr-300"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </Button>
        )}
      </CanAccess>
      <CanAccess permission={edit_action?.permission}>
        {edit_action && (
          <Button
            fitContent
            padding="padding-0"
            variant="icon"
            title={edit_action.label(resource_label)}
            href={`${edit_action?.path(resource_id)!}`}
            disabled={!edit_action.can(can_edit_action)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-3 h-3 clr-neutral-800 hover:clr-primary-700 transition:clr-300"
              viewBox="0 0 24 24"
            >
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
            </svg>
          </Button>
        )}
      </CanAccess>
      {children}
      <CanAccess permission={delete_action?.permission}>
        {delete_action && (
          <Button
            onClick={handleDelete}
            padding="padding-0"
            fitContent
            variant="icon"
            title={delete_action.label(resource_label)}
            disabled={!delete_action.can(can_delete_action)}
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
      </CanAccess>
    </div>
  )
}

Table.Header = Header;
Table.HeaderCell = HeaderCell;
Table.Row = Row;
Table.Cell = Cell;
Table.Body = Body;
Table.Actions = Actions;

export default Table;
