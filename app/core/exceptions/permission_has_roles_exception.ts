import { Exception } from '@adonisjs/core/exceptions'

export default class PermissionHasRolesException extends Exception {
  static status = 409
  static code = 'PERMISSION_HAS_ROLES'

  constructor(public rolesCount: number) {
    super(`This permission is assigned to ${rolesCount} role(s) and cannot be deleted`, {
      status: PermissionHasRolesException.status,
      code: PermissionHasRolesException.code,
    })
  }
}
