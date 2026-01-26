import { test } from '@japa/runner'
import { generateToken, generateSplitToken, splitToken, maskToken } from '#core/helpers/crypto'
import { sleep } from '#core/helpers/sleep'
import { getPaginationParams } from '#core/helpers/pagination'

test.group('Core Helpers / Crypto', () => {
  test('generateToken: should generate a hex string of correct length', ({ assert }) => {
    const token = generateToken(16)
    assert.lengthOf(token, 32)
  })

  test('generateSplitToken: should return selector, validator and fullToken', ({ assert }) => {
    const { selector, validator, fullToken } = generateSplitToken(8, 8)
    assert.lengthOf(selector, 16)
    assert.lengthOf(validator, 16)
    assert.equal(fullToken, `${selector}.${validator}`)
  })

  test('splitToken: should split valid token', ({ assert }) => {
    const parts = splitToken('abc.def')
    assert.deepEqual(parts, { selector: 'abc', validator: 'def' })
  })

  test('splitToken: should return null for invalid token', ({ assert }) => {
    assert.isNull(splitToken('invalid'))
    assert.isNull(splitToken('too.many.parts'))
    assert.isNull(splitToken('empty.'))
    assert.isNull(splitToken('.empty'))
  })

  test('maskToken: should mask long token', ({ assert }) => {
    const token = '1234567890123456'
    const masked = maskToken(token)
    assert.equal(masked, '12345678****3456')
  })

  test('maskToken: should not mask short token', ({ assert }) => {
    const token = '123456789012'
    assert.equal(maskToken(token), token)
  })
})

test.group('Core Helpers / Sleep', () => {
  test('sleep: should wait for specified time', async ({ assert }) => {
    const start = Date.now()
    await sleep(100)
    const end = Date.now()
    assert.isTrue(end - start >= 99)
  })
})

test.group('Core Helpers / Pagination', () => {
  test('getPaginationParams: should return defaults when no input', ({ assert }) => {
    const mockRequest = { input: () => null } as any
    const params = getPaginationParams(mockRequest)
    assert.equal(params.page, 1)
    assert.equal(params.perPage, 15)
  })

  test('getPaginationParams: should return validated params', ({ assert }) => {
    const mockRequest = {
      input: (key: string) => (key === 'page' ? '2' : '20'),
    } as any
    const params = getPaginationParams(mockRequest)
    assert.equal(params.page, 2)
    assert.equal(params.perPage, 20)
  })

  test('getPaginationParams: should enforce limits', ({ assert }) => {
    const mockRequest = {
      input: (key: string) => (key === 'page' ? '-5' : '1000'),
    } as any
    const params = getPaginationParams(mockRequest)
    assert.equal(params.page, 1)
    assert.equal(params.perPage, 100)
  })
})
