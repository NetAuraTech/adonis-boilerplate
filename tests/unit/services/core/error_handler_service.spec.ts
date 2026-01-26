import { test } from '@japa/runner'
import sinon from 'sinon'
import ErrorHandlerService from '#core/services/error_handler_service'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import PermissionHasRolesException from '#core/exceptions/permission_has_roles_exception'
import RoleHasUsersException from '#core/exceptions/role_has_users_exception'
import TooManyRequestsException from '#core/exceptions/too_many_requests_exception'
import ActionForbiddenException from '#core/exceptions/action_forbidden_exception'
import ProviderNotConfiguredException from '#core/exceptions/provider_not_configured_exception'
import ProviderAlreadyLinkedException from '#core/exceptions/provider_already_linked_exception'
import app from '@adonisjs/core/services/app'

test.group('ErrorHandlerService', (group) => {
  let errorHandler: ErrorHandlerService

  group.setup(async () => {
    errorHandler = await app.container.make(ErrorHandlerService)
  })

  group.teardown(() => {
    sinon.restore()
  })

  group.each.teardown(() => {
    sinon.restore()
  })

  test('handle: should flash error message and redirect back', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new Exception('Test error', { status: 400, code: 'TEST_ERROR' })

    await errorHandler.handle(ctx, error)

    assert.isTrue((ctx.session.flash as sinon.SinonSpy).calledWith('error'))
    assert.isTrue((ctx.response.redirect as sinon.SinonStub).called)
  })

  test('handle: should handle E_ROW_NOT_FOUND', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new Exception('Not found', { status: 404, code: 'E_ROW_NOT_FOUND' })

    await errorHandler.handle(ctx, error)

    assert.isTrue((ctx.session.flash as sinon.SinonSpy).calledWith('error', 'common.not_found'))
  })

  test('handle: should handle E_INVALID_CREDENTIALS', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new Exception('Invalid', { status: 401, code: 'E_INVALID_CREDENTIALS' })

    await errorHandler.handle(ctx, error)

    assert.isTrue((ctx.session.flash as sinon.SinonSpy).calledWith('error', 'auth.login.failed'))
  })

  test('handle: should redirect to login for E_UNAUTHORIZED', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new Exception('Unauthorized', { status: 401, code: 'E_UNAUTHORIZED' })

    await errorHandler.handle(ctx, error)

    const redirectChain = (ctx.response.redirect as sinon.SinonStub)()
    assert.isTrue((redirectChain.toRoute as sinon.SinonStub).calledWith('auth.login'))
  })

  test('handle: should handle PermissionHasRolesException', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new PermissionHasRolesException(3)

    await errorHandler.handle(ctx, error)

    assert.isTrue(
      (ctx.session.flash as sinon.SinonSpy).calledWith('error', 'admin.permissions.has_roles')
    )
  })

  test('handle: should handle RoleHasUsersException', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new RoleHasUsersException(5)

    await errorHandler.handle(ctx, error)

    assert.isTrue(
      (ctx.session.flash as sinon.SinonSpy).calledWith('error', 'admin.roles.has_users')
    )
  })

  test('handle: should handle TooManyRequestsException with retryAfter', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new TooManyRequestsException('Too many requests. Please wait 5 minutes.', 300, 5)

    await errorHandler.handle(ctx, error)

    assert.isTrue((ctx.response.header as sinon.SinonSpy).calledWith('Retry-After', '300'))
    assert.isTrue((ctx.session.flash as sinon.SinonSpy).called)
  })

  test('handle: should use custom handler when provided', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new Exception('Custom', { status: 400, code: 'CUSTOM_ERROR' })
    const customHandlers = [
      {
        code: 'CUSTOM_ERROR',
        message: 'Custom message',
      },
    ]

    await errorHandler.handle(ctx, error, customHandlers)

    assert.isTrue((ctx.session.flash as sinon.SinonSpy).calledWith('error', 'Custom message'))
  })

  test('handle: should use custom callback when provided', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new Exception('Custom', { status: 400, code: 'CUSTOM_ERROR' })
    const callbackSpy = sinon.spy(() => ctx.response)
    const customHandlers = [
      {
        code: 'CUSTOM_ERROR',
        callback: callbackSpy,
      },
    ]

    await errorHandler.handle(ctx, error, customHandlers)

    assert.isTrue(callbackSpy.called)
  })

  test('handle: should rethrow E_VALIDATION_ERROR', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new Exception('Validation', { code: 'E_VALIDATION_ERROR' })

    await assert.rejects(async () => errorHandler.handle(ctx, error))
  })

  test('handleApi: should return JSON error response', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new Exception('Test error', { status: 400, code: 'TEST_ERROR' })

    await errorHandler.handleApi(ctx, error)

    assert.isTrue((ctx.response.status as sinon.SinonStub).calledWith(400))
    assert.isTrue((ctx.response.json as sinon.SinonSpy).called)
    const jsonCall = (ctx.response.json as sinon.SinonSpy).getCall(0)
    assert.exists(jsonCall.args[0].error)
  })

  test('handleApi: should handle E_VALIDATION_ERROR', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new Exception('Validation', { code: 'E_VALIDATION_ERROR' })

    await errorHandler.handleApi(ctx, error)

    assert.isTrue((ctx.response.status as sinon.SinonStub).calledWith(422))
    const jsonCall = (ctx.response.json as sinon.SinonSpy).getCall(0)
    assert.equal(jsonCall.args[0].error.code, 'E_VALIDATION_ERROR')
  })

  test('handleApi: should include retryAfter in response for TooManyRequestsException', async ({
    assert,
  }) => {
    const ctx = createMockContext()
    const error = new TooManyRequestsException('Too many requests', 300, 5)

    await errorHandler.handleApi(ctx, error)

    const jsonCall = (ctx.response.json as sinon.SinonSpy).getCall(0)
    assert.equal(jsonCall.args[0].error.retryAfter, 300)
    assert.equal(jsonCall.args[0].error.retryMinutes, 5)
  })

  test('handleApi: should use custom handler', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new Exception('Custom', { status: 400, code: 'CUSTOM_ERROR' })
    const customHandlers = [
      {
        code: 'CUSTOM_ERROR',
        message: 'Custom API message',
      },
    ]

    await errorHandler.handleApi(ctx, error, customHandlers)

    const jsonCall = (ctx.response.json as sinon.SinonSpy).getCall(0)
    assert.equal(jsonCall.args[0].error.message, 'Custom API message')
  })

  test('handleApi: should handle common errors', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new Exception('Not found', { status: 404, code: 'E_ROW_NOT_FOUND' })

    await errorHandler.handleApi(ctx, error)

    assert.isTrue((ctx.response.status as sinon.SinonStub).calledWith(404))
    const jsonCall = (ctx.response.json as sinon.SinonSpy).getCall(0)
    assert.equal(jsonCall.args[0].error.code, 'E_ROW_NOT_FOUND')
  })

  test('isApiRequest: should detect JSON accept header', ({ assert }) => {
    const ctx = createMockContext()
    const headerStub = ctx.request.header as sinon.SinonStub
    headerStub.withArgs('accept').returns('application/json')

    const isApi = errorHandler.isApiRequest(ctx as any)
    assert.isTrue(isApi)
  })

  test('isApiRequest: should detect JSON content-type', ({ assert }) => {
    const ctx = createMockContext()
    const headerStub = ctx.request.header as sinon.SinonStub
    headerStub.withArgs('content-type').returns('application/json')

    const isApi = errorHandler.isApiRequest(ctx as any)
    assert.isTrue(isApi)
  })

  test('isApiRequest: should detect /api/ URL', ({ assert }) => {
    const ctx = createMockContext()
    ;(ctx.request.url as sinon.SinonStub).returns('/api/users')

    const isApi = errorHandler.isApiRequest(ctx as any)
    assert.isTrue(isApi)
  })

  test('isApiRequest: should return false for regular requests', ({ assert }) => {
    const ctx = createMockContext()

    const isApi = errorHandler.isApiRequest(ctx as any)
    assert.isFalse(isApi)
  })

  test('handle: should handle ProviderNotConfiguredException', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new ProviderNotConfiguredException('github')

    await errorHandler.handle(ctx, error)

    assert.isTrue((ctx.session.flash as sinon.SinonSpy).called)
  })

  test('handle: should handle ProviderAlreadyLinkedException', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new ProviderAlreadyLinkedException('google')

    await errorHandler.handle(ctx, error)

    assert.isTrue((ctx.session.flash as sinon.SinonSpy).called)
  })

  test('handle: should handle ActionForbiddenException', async ({ assert }) => {
    const ctx = createMockContext()
    const error = new ActionForbiddenException('CANNOT_SELF_DELETE')

    await errorHandler.handle(ctx, error)

    assert.isTrue((ctx.session.flash as sinon.SinonSpy).called)
  })
})

function createMockContext(): HttpContext {
  const sessionFlash = sinon.spy()
  const responseStatus = sinon.stub().returnsThis()
  const responseBack = sinon.stub().returnsThis()
  const responseToRoute = sinon.stub().returnsThis()
  const responseRedirect = sinon.stub().returns({
    back: responseBack,
    toRoute: responseToRoute,
  })
  const responseJson = sinon.spy()
  const responseHeader = sinon.spy()
  const requestUrl = sinon.stub().returns('/test')
  const requestMethod = sinon.stub().returns('GET')
  const requestIp = sinon.stub().returns('127.0.0.1')
  const requestHeader = sinon.stub().returns(null)

  return {
    session: {
      flash: sessionFlash,
    },
    response: {
      status: responseStatus,
      redirect: responseRedirect,
      json: responseJson,
      header: responseHeader,
    },
    i18n: {
      t: (key: string) => key,
    },
    request: {
      url: requestUrl,
      method: requestMethod,
      ip: requestIp,
      header: requestHeader,
    },
    auth: {
      user: null,
    },
  } as any
}
