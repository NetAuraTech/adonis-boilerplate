export interface ResourceAction {
  label: () => string
  path: () => string
  confirm_message?: string
  can: (can: boolean) => boolean
  permission: string
}

export interface ResourceActionWithParams {
  label: (label?: string) => string
  path: (id: number) => string
  confirm_message?: string
  can: (can: boolean) => boolean
  permission: string
}

export interface ResourceDefinition {
  label: string
  icon: string
  index?: ResourceAction
  create?: ResourceAction
  store?: ResourceAction
  show?: ResourceActionWithParams
  edit?: ResourceActionWithParams
  update?: ResourceActionWithParams
  delete?: ResourceActionWithParams
}

export type AdminResource = Record<string, ResourceDefinition>

export type ActionKey = Exclude<keyof ResourceDefinition, 'icon'>

export interface AdminNavCategory {
  label: string
  resourceKeys: (keyof AdminResource)[]
}

export interface AdminNavLink {
  label: string
  path: string
  icon: string
  permission: string
}

export interface AdminNavCategoryDisplay {
  label: string
  links: AdminNavLink[]
}
