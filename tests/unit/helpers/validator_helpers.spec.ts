import { test } from '@japa/runner'
import { unique, exists } from '#core/helpers/validator'
import { UserFactory } from '#tests/helpers/factories'
import db from '@adonisjs/lucid/services/db'

test.group('Core Helpers / Validator', () => {
  test('unique: should report error if value exists', async ({ assert }) => {
    const user = await UserFactory.create({ email: 'taken@example.com' })
    const rule = unique('users', 'email')

    let errorReported = false
    const mockField = {
      report: () => {
        errorReported = true
      },
    } as any

    const result = await rule(db, user.email, mockField)

    assert.isFalse(result)
    assert.isTrue(errorReported)
  })

  test('unique: should pass if value does not exist', async ({ assert }) => {
    const rule = unique('users', 'email')
    const mockField = { report: () => {} } as any

    const result = await rule(db, 'fresh@example.com', mockField)

    assert.isTrue(result)
  })

  test('unique: should allow exceptId', async ({ assert }) => {
    const user = await UserFactory.create({ email: 'myemail@example.com' })
    const rule = unique('users', 'email', { exceptId: user.id })
    const mockField = { report: () => {} } as any

    const result = await rule(db, user.email, mockField)

    assert.isTrue(result)
  })

  test('exists: should pass if value exists', async ({ assert }) => {
    const user = await UserFactory.create({ email: 'exists@example.com' })
    const rule = exists('users', 'email')

    const result = await rule(db, user.email, {} as any)

    assert.isTrue(result)
  })

  test('exists: should fail if value does not exist', async ({ assert }) => {
    const rule = exists('users', 'email')

    const result = await rule(db, 'ghost@example.com', {} as any)

    assert.isFalse(result)
  })
})
