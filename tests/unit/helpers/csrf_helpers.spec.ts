import { test } from '@japa/runner'
import { verifyCsrfToken } from '#core/helpers/csrf'

test.group('Core Helpers / CSRF', () => {
  test('verifyCsrfToken: should return true if token is present in input', async ({ assert }) => {
    const mockCtx = {
      request: {
        input: (key: string) => (key === '_csrf' ? 'valid-token' : null),
        url: () => '/test',
        ip: () => '127.0.0.1',
      },
      auth: { user: { id: 1 } },
    } as any

    const result = await verifyCsrfToken(mockCtx)
    assert.isTrue(result)
  })

  test('verifyCsrfToken: should return true if token is present in header', async ({ assert }) => {
    const mockCtx = {
      request: {
        input: () => null,
        header: (key: string) => (key === 'x-csrf-token' ? 'valid-token' : null),
        url: () => '/test',
        ip: () => '127.0.0.1',
      },
      auth: { user: { id: 1 } },
    } as any

    const result = await verifyCsrfToken(mockCtx)
    assert.isTrue(result)
  })

  test('verifyCsrfToken: should return false if token is missing', async ({ assert }) => {
    const mockCtx = {
      request: {
        input: () => null,
        header: () => null,
        url: () => '/test',
        ip: () => '127.0.0.1',
      },
      auth: { user: { id: 1 } },
    } as any

    const result = await verifyCsrfToken(mockCtx)
    assert.isFalse(result)
  })
})
