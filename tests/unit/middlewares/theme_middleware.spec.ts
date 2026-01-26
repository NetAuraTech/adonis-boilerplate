import { test } from '@japa/runner'
import ThemeMiddleware from '#core/middleware/theme_middleware'

test.group('ThemeMiddleware', () => {
  test('should share theme from cookie with inertia', async ({ assert }) => {
    const middleware = new ThemeMiddleware()
    let sharedTheme: string | null = null

    const mockCtx = {
      request: {
        cookie: (name: string) => (name === 'theme' ? 'dark' : null),
      },
      inertia: {
        share: (data: { theme: string | null }) => {
          sharedTheme = data.theme
        },
      },
    } as any

    await middleware.handle(mockCtx, async () => {})

    assert.equal(sharedTheme, 'dark')
  })

  test('should share null if theme cookie is missing', async ({ assert }) => {
    const middleware = new ThemeMiddleware()
    let sharedTheme: any

    const mockCtx = {
      request: {
        cookie: () => null,
      },
      inertia: {
        share: (data: { theme: string | null }) => {
          sharedTheme = data.theme
        },
      },
    } as any

    await middleware.handle(mockCtx, async () => {})

    assert.isNull(sharedTheme)
  })
})
