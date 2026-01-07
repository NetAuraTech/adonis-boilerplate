import BaseAdminValidator from '#core/validators/base_admin_validator'
import vine from '@vinejs/vine'
import { unique } from '#core/helpers/validator'

export default class AdminUserValidators extends BaseAdminValidator {
  static id = () => {
    return vine.compile(
      vine.object({
        id: vine.number(),
      })
    )
  }

  static list = (allowedRoleIds: string[]) => {
    return vine.compile(
      vine.object({
        search: vine.string().trim().maxLength(100).optional(),
        role: vine.string().in(allowedRoleIds).optional(),
      })
    )
  }

  static create = (allowedRoleIds: number[]) => {
    return vine.compile(
      vine.object({
        email: vine.string().trim().toLowerCase().email().unique(unique('users', 'email')),
        fullName: vine.string().trim().minLength(2).maxLength(255).optional(),
        role_id: vine.number().in(allowedRoleIds).optional(),
      })
    )
  }

  static update = (id: number, allowedRoleIds: number[]) => {
    return vine.compile(
      vine.object({
        fullName: vine.string().trim().minLength(2).maxLength(255).optional(),
        email: vine
          .string()
          .trim()
          .toLowerCase()
          .email()
          .unique(unique('users', 'email', { exceptId: id })),
        role_id: vine.number().in(allowedRoleIds).optional(),
      })
    )
  }
}
