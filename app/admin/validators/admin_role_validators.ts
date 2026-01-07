import BaseAdminValidator from '#core/validators/base_admin_validator'
import vine from '@vinejs/vine'

export default class AdminRoleValidators extends BaseAdminValidator {
  static create = () => {
    return vine.compile(
      vine.object({
        name: vine.string().trim().minLength(2).maxLength(50),
        description: vine.string().trim().maxLength(255).optional(),
        permission_ids: vine.array(vine.number()),
      })
    )
  }

  static update = () => {
    return vine.compile(
      vine.object({
        name: vine.string().trim().minLength(2).maxLength(50),
        description: vine.string().trim().maxLength(255).optional(),
        permission_ids: vine.array(vine.number()),
      })
    )
  }
}
