import vine from '@vinejs/vine'
import { unique } from '#core/helpers/validator'

export default class ProfileValidators {
  static updateProfile = (id: number) => {
    return vine.compile(
      vine.object({
        fullName: vine.string().trim().minLength(2).maxLength(255).optional(),
        email: vine
          .string()
          .trim()
          .toLowerCase()
          .email()
          .unique(unique('users', 'email', { exceptId: id })),
        locale: vine.enum(['en', 'fr']),
      })
    )
  }

  static updatePassword = () => {
    return vine.compile(
      vine.object({
        current_password: vine.string(),
        password: vine.string().minLength(8).confirmed(),
      })
    )
  }

  static deleteProfile = () => {
    return vine.compile(
      vine.object({
        password: vine.string(),
      })
    )
  }
}
