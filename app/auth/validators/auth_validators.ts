import vine from '@vinejs/vine'
import { unique } from '#core/helpers/validator'

export default class AuthValidators {
  static login = () => {
    return vine.compile(
      vine.object({
        email: vine.string().trim().toLowerCase().email(),
        password: vine.string(),
        remember_me: vine.boolean().optional(),
      })
    )
  }

  static register = () => {
    return vine.compile(
      vine.object({
        email: vine.string().trim().toLowerCase().email().unique(unique('users', 'email')),
        password: vine.string().minLength(8).confirmed(),
      })
    )
  }

  static forgotPassword = () => {
    return vine.compile(
      vine.object({
        email: vine.string().trim().toLowerCase().email(),
      })
    )
  }

  static resetPassword = () => {
    return vine.compile(
      vine.object({
        token: vine.string(),
        password: vine.string().minLength(8).confirmed(),
      })
    )
  }

  static acceptInvitation = () => {
    return vine.compile(
      vine.object({
        token: vine.string(),
        full_name: vine.string().trim().minLength(2).maxLength(255).optional(),
        password: vine.string().minLength(8).confirmed(),
      })
    )
  }

  static definePassword = () => {
    return vine.compile(
      vine.object({
        password: vine.string().minLength(8).confirmed(),
      })
    )
  }
}
