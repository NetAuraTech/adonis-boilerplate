import { Exception } from '@adonisjs/core/exceptions'

export default class RoleHasUsersException extends Exception {
  static status = 409
  static code = 'ROLE_HAS_USERS'

  constructor(public usersCount: number) {
    super(`This role is assigned to ${usersCount} user(s) and cannot be deleted`, {
      status: RoleHasUsersException.status,
      code: RoleHasUsersException.code,
    })
  }
}
