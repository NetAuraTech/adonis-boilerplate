import { VineValidator } from '@vinejs/vine'

export default abstract class BaseAdminValidator {
  static list: (...args: any[]) => VineValidator<any, any>
  static create: (...args: any[]) => VineValidator<any, any>
  static update: (...args: any[]) => VineValidator<any, any>
}
