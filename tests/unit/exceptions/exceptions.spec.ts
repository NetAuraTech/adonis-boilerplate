import { test } from '@japa/runner'
import ActionForbiddenException from '#core/exceptions/action_forbidden_exception'
import ProviderAlreadyLinkedException from '#core/exceptions/provider_already_linked_exception'
import CsrfTokenMismatchException from '#core/exceptions/csrf_token_mismatch_exception'
import PermissionHasRolesException from '#core/exceptions/permission_has_roles_exception'
import ProviderNotConfiguredException from '#core/exceptions/provider_not_configured_exception'
import RoleHasUsersException from '#core/exceptions/role_has_users_exception'
import TooManyRequestsException from '#core/exceptions/too_many_requests_exception'

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
    assert.include(error.message, 'github')
  })

  test('CsrfTokenMismatchException: should have correct status and code', ({ assert }) => {
    const error = new CsrfTokenMismatchException()
    assert.equal(error.status, 419)
    assert.equal(error.code, 'E_CSRF_TOKEN_MISMATCH')
  })

  test('PermissionHasRolesException: should have correct status and code', ({ assert }) => {
    const error = new PermissionHasRolesException(1)
    assert.equal(error.status, 409)
    assert.equal(error.code, 'PERMISSION_HAS_ROLES')
  })

  test('ProviderNotConfiguredException: should have correct status and code', ({ assert }) => {
    const error = new ProviderNotConfiguredException('google')
    assert.equal(error.status, 400)
    assert.equal(error.code, 'E_PROVIDER_NOT_CONFIGURED')
    assert.include(error.message, 'google')
  })

  test('RoleHasUsersException: should have correct status and code', ({ assert }) => {
    const error = new RoleHasUsersException(5)
    assert.equal(error.status, 409)
    assert.equal(error.code, 'ROLE_HAS_USERS')
  })

  test('TooManyRequestsException: should have correct status and code', ({ assert }) => {
    const error = new TooManyRequestsException('Too many requests')
    assert.equal(error.status, 429)
    assert.equal(error.code, 'E_RATE_LIMIT')
    assert.equal(error.message, 'Too many requests')
  })
})
