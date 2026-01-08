import { Exception } from '@adonisjs/core/exceptions'

export default class ProviderNotConfiguredException extends Exception {
  static status = 400
  static code = 'E_PROVIDER_NOT_CONFIGURED'

  constructor(public provider: string) {
    super(`${provider} authentication is not configured.`, {
      status: ProviderNotConfiguredException.status,
      code: ProviderNotConfiguredException.code,
    })
  }
}
