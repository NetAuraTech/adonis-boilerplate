import { Exception } from '@adonisjs/core/exceptions'

export default class ProviderAlreadyLinkedException extends Exception {
  static status = 409
  static code = 'E_PROVIDER_ALREADY_LINKED'

  constructor(public provider: string) {
    super(`This ${provider} account is already linked to another user.`, {
      status: ProviderAlreadyLinkedException.status,
      code: ProviderAlreadyLinkedException.code,
    })
  }
}
