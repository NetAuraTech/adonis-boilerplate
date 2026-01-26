import { test } from '@japa/runner'
import ActionForbiddenException from '#core/exceptions/action_forbidden_exception'
import ProviderAlreadyLinkedException from '#core/exceptions/provider_already_linked_exception'

test.group('Custom Exceptions', () => {
  test('ActionForbiddenException: should have correct status and code', ({ assert }) => {
    const error = new ActionForbiddenException()
    assert.equal(error.status, 403)
    assert.equal(error.code, 'E_ACTION_FORBIDDEN')
    assert.equal(error.message, 'Action forbidden')
  })

  test('ProviderAlreadyLinkedException: should have correct status and code', ({ assert }) => {
    const error = new ProviderAlreadyLinkedException('github')
    assert.equal(error.status, 409)
    assert.equal(error.code, 'E_PROVIDER_ALREADY_LINKED')
  })
})
