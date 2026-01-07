import { Exception } from '@adonisjs/core/exceptions'

export default class ActionForbiddenException extends Exception {
  static status = 403
  static code = 'E_ACTION_FORBIDDEN'
}
