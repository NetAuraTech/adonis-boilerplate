import BaseAdminValidator from '#core/validators/base_admin_validator'
import vine from '@vinejs/vine'

export default class AdminPermissionValidators extends BaseAdminValidator {
  static list = () => {
    return vine.compile(
      vine.object({
        search: vine.string().trim().maxLength(100).optional(),
        category: vine.string().trim().maxLength(50).optional(),
      })
    )
  }

  static create = () => {
    return vine.compile(
      vine.object({
        name: vine.string().trim().minLength(2).maxLength(100),
        category: vine.string().trim().minLength(2).maxLength(50),
        slug: vine.string().trim().minLength(2).maxLength(100),
        description: vine.string().trim().maxLength(255).optional(),
      })
    )
  }

  static update = () => {
    return vine.compile(
      vine.object({
        name: vine.string().trim().minLength(2).maxLength(100),
        category: vine.string().trim().minLength(2).maxLength(50),
        slug: vine.string().trim().maxLength(100),
        description: vine.string().trim().maxLength(255).optional(),
      })
    )
  }
}
