import { test } from '@japa/runner'
import DetectUserLocaleMiddleware from '#core/middleware/detect_user_locale_middleware'
import { UserFactory } from '#tests/helpers/factories'
import sinon from 'sinon'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

test.group('DetectUserLocaleMiddleware', (group) => {
  let middleware: DetectUserLocaleMiddleware

  group.setup(async () => {
    middleware = await app.container.make(DetectUserLocaleMiddleware)
  })

  test('handle: should use user locale when authenticated', async ({ assert }) => {
    const user = await UserFactory.create({ locale: 'fr' })
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user, acceptLanguages: ['en'] })

    await middleware.handle(ctx, nextFn)

    assert.equal(ctx.i18n.locale, 'fr')
    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should use Accept-Language header when user not authenticated', async ({
    assert,
  }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      user: null,
      acceptLanguages: ['fr', 'en'],
      supportedLocale: 'fr',
    })

    await middleware.handle(ctx, nextFn)

    assert.equal(ctx.i18n.locale, 'fr')
    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should use default locale when no preference found', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      user: null,
      acceptLanguages: ['de'],
      supportedLocale: null,
      defaultLocale: 'en',
    })

    await middleware.handle(ctx, nextFn)

    assert.equal(ctx.i18n.locale, 'en')
    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should prioritize user locale over Accept-Language', async ({ assert }) => {
    const user = await UserFactory.create({ locale: 'fr' })
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      user,
      acceptLanguages: ['en', 'de'],
      supportedLocale: 'en',
    })

    await middleware.handle(ctx, nextFn)

    assert.equal(ctx.i18n.locale, 'fr')
  })

  test('handle: should handle user without locale preference', async ({ assert }) => {
    const user = await UserFactory.create({ locale: null })
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      user,
      acceptLanguages: ['fr'],
      supportedLocale: 'fr',
    })

    await middleware.handle(ctx, nextFn)

    assert.equal(ctx.i18n.locale, 'fr')
  })

  test('handle: should share i18n with view', async ({ assert }) => {
    const user = await UserFactory.create({ locale: 'fr' })
    const nextFn = sinon.spy()
    const viewShareSpy = sinon.spy()
    const ctx = createMockContext({
      user,
      acceptLanguages: ['en'],
      hasView: true,
      viewShare: viewShareSpy,
    })

    await middleware.handle(ctx, nextFn)

    assert.isTrue(viewShareSpy.calledWith({ i18n: ctx.i18n }))
  })

  test('handle: should not throw if view is not available', async ({ assert }) => {
    const user = await UserFactory.create({ locale: 'fr' })
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      user,
      acceptLanguages: ['en'],
      hasView: false,
    })

    await assert.doesNotReject(async () => middleware.handle(ctx, nextFn))
  })

  test('handle: should call next after setting locale', async ({ assert }) => {
    const user = await UserFactory.create({ locale: 'fr' })
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
  })

  test('real-world: authenticated French user', async ({ assert }) => {
    const user = await UserFactory.create({ locale: 'fr' })
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user, acceptLanguages: ['en'] })

    await middleware.handle(ctx, nextFn)

    assert.equal(ctx.i18n.locale, 'fr')
  })

  test('real-world: guest with French browser', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      user: null,
      acceptLanguages: ['fr-FR', 'fr', 'en'],
      supportedLocale: 'fr',
    })

    await middleware.handle(ctx, nextFn)

    assert.equal(ctx.i18n.locale, 'fr')
  })

  test('real-world: guest with unsupported language', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      user: null,
      acceptLanguages: ['ja', 'zh'],
      supportedLocale: null,
      defaultLocale: 'en',
    })

    await middleware.handle(ctx, nextFn)

    assert.equal(ctx.i18n.locale, 'en')
  })

  test('edge case: user with empty string locale', async ({ assert }) => {
    const user = await UserFactory.create({ locale: '' })
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      user,
      acceptLanguages: ['fr'],
      supportedLocale: 'fr',
    })

    await middleware.handle(ctx, nextFn)

    assert.equal(ctx.i18n.locale, 'fr')
  })

  test('edge case: empty Accept-Language header', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      user: null,
      acceptLanguages: [],
      supportedLocale: null,
      defaultLocale: 'en',
    })

    await middleware.handle(ctx, nextFn)

    assert.equal(ctx.i18n.locale, 'en')
  })

  test('consistency: multiple calls should use same locale', async ({ assert }) => {
    const user = await UserFactory.create({ locale: 'fr' })
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn)
    const firstLocale = ctx.i18n.locale

    await middleware.handle(ctx, nextFn)
    const secondLocale = ctx.i18n.locale

    assert.equal(firstLocale, secondLocale)
  })
})

interface MockContextOptions {
  user?: any
  acceptLanguages?: string[]
  supportedLocale?: string | null
  defaultLocale?: string
  hasView?: boolean
  viewShare?: sinon.SinonSpy
}

const createMockContext = (options: MockContextOptions = {}): HttpContext => {
  const {
    user = null,
    acceptLanguages = ['en'],
    supportedLocale = 'en',
    defaultLocale = 'en',
    hasView = false,
    viewShare = sinon.spy(),
  } = options

  const i18nManagerMock = {
    getSupportedLocaleFor: sinon.stub().returns(supportedLocale),
    locale: sinon.stub().callsFake((locale: string) => ({ locale })),
    defaultLocale,
  }

  const ctx: any = {
    auth: {
      user,
    },
    request: {
      languages: sinon.stub().returns(acceptLanguages),
      url: () => '/test',
      method: () => 'GET',
    },
    response: {
      redirect: sinon.stub().returnsThis(),
      status: sinon.stub().returnsThis(),
    },
    containerResolver: {
      bindValue: sinon.stub(),
    },
  }

  if (hasView) {
    ctx.view = {
      share: viewShare,
    }
  }

  // Simuler i18nManager global
  ;(global as any).i18nManager = i18nManagerMock

  return ctx
}
