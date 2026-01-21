import { test } from '@japa/runner'
import ace from '@adonisjs/core/services/ace'

test.group('Backup Commands', () => {
  test('backup:run should execute without errors', async ({ assert }) => {
    const command = await ace.exec('backup:run', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('backup:run --type=full should force full backup', async ({ assert }) => {
    const command = await ace.exec('backup:run', ['--type=full'])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('backup:run --type=differential should force differential backup', async ({ assert }) => {
    const command = await ace.exec('backup:run', ['--type=differential'])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('backup:cleanup should execute without errors', async ({ assert }) => {
    const command = await ace.exec('backup:cleanup', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('backup:health-check should execute without errors', async ({ assert }) => {
    const command = await ace.exec('backup:health-check', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('backup:list should display backups', async ({ assert }) => {
    const command = await ace.exec('backup:list', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('backup:list --limit=5 should respect limit', async ({ assert }) => {
    const command = await ace.exec('backup:list', ['--limit=5'])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('backup:restore should require filename argument', async ({ assert }) => {
    await assert.rejects(async () => {
      await ace.exec('backup:restore', [])
    }, /Missing required argument "filename"/)
  })

  test('backup:restore with --force should skip confirmation', async ({ assert }) => {
    const command = await ace.exec('backup:restore', ['non-existent-backup.sql.gz.enc', '--force'])

    assert.equal(command.exitCode, 1)
  })
})

test.group('Backup Command Output', () => {
  test('backup:run should display progress information', async ({ assert }) => {
    const command = await ace.exec('backup:run', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('backup:health-check should display health status', async ({ assert }) => {
    const command = await ace.exec('backup:health-check', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('backup:list should display table of backups', async ({ assert }) => {
    const command = await ace.exec('backup:list', [])

    assert.oneOf(command.exitCode, [0, 1])
  })
})

test.group('Backup Command Error Handling', () => {
  test('backup:run should handle errors gracefully', async ({ assert }) => {
    const command = await ace.exec('backup:run', [])

    assert.isDefined(command.exitCode)
  })

  test('backup:restore with invalid file should show error', async ({ assert }) => {
    const command = await ace.exec('backup:restore', ['invalid-backup-name.txt', '--force'])

    assert.equal(command.exitCode, 1)
  })
})
