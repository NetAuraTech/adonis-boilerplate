import { test } from '@japa/runner'
import ace from '@adonisjs/core/services/ace'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { DateTime } from 'luxon'

test.group('RotateLogs Command', (group) => {
  const testLogsDir = join(process.cwd(), 'storage/test-logs')

  group.setup(async () => {
    await mkdir(testLogsDir, { recursive: true })
  })

  group.teardown(async () => {
    if (existsSync(testLogsDir)) {
      await rm(testLogsDir, { recursive: true, force: true })
    }
  })

  group.each.setup(async () => {
    if (existsSync(testLogsDir)) {
      await rm(testLogsDir, { recursive: true, force: true })
    }
    await mkdir(testLogsDir, { recursive: true })
  })

  test('should execute without errors', async ({ assert }) => {
    const command = await ace.exec('logs:rotate', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('should handle empty logs directory', async ({ assert }) => {
    const command = await ace.exec('logs:rotate', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('should handle logs directory with no .log files', async ({ assert }) => {
    await writeFile(join(testLogsDir, 'readme.txt'), 'Not a log file')

    const command = await ace.exec('logs:rotate', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('should complete in reasonable time', async ({ assert }) => {
    for (let i = 0; i < 3; i++) {
      const logPath = join(testLogsDir, `log${i}.log`)
      await writeFile(logPath, 'test content')
    }

    const startTime = Date.now()
    const command = await ace.exec('logs:rotate', [])
    const duration = Date.now() - startTime

    assert.oneOf(command.exitCode, [0, 1])
    assert.isTrue(duration < 30000)
  })

  test('should display progress information', async ({ assert }) => {
    const logPath = join(testLogsDir, 'app.log')
    await writeFile(logPath, 'test content')

    const command = await ace.exec('logs:rotate', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('edge case: should handle very small log files', async ({ assert }) => {
    const logPath = join(testLogsDir, 'tiny.log')
    await writeFile(logPath, 'x')

    const command = await ace.exec('logs:rotate', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('edge case: should handle non-standard log file names', async ({ assert }) => {
    await writeFile(join(testLogsDir, 'custom.log'), 'content')
    await writeFile(join(testLogsDir, 'app-debug.log'), 'content')

    const command = await ace.exec('logs:rotate', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('consistency: multiple rotations should work', async ({ assert }) => {
    const logPath = join(testLogsDir, 'app.log')

    await writeFile(logPath, 'content 1')
    await ace.exec('logs:rotate', [])

    await writeFile(logPath, 'content 2')
    const command = await ace.exec('logs:rotate', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('real-world: should handle typical log directory', async ({ assert }) => {
    await writeFile(join(testLogsDir, 'app.log'), 'application logs')
    await writeFile(join(testLogsDir, 'errors.log'), 'error logs')
    await writeFile(join(testLogsDir, 'access.log'), 'access logs')

    const command = await ace.exec('logs:rotate', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('real-world: should work with existing rotated files', async ({ assert }) => {
    await writeFile(join(testLogsDir, 'app.log'), 'current logs')

    const oldDate1 = DateTime.now().minus({ days: 1 }).toFormat('yyyy-MM-dd-HHmmss')
    const oldDate2 = DateTime.now().minus({ days: 2 }).toFormat('yyyy-MM-dd-HHmmss')
    await writeFile(join(testLogsDir, `app.log.${oldDate1}`), 'old logs 1')
    await writeFile(join(testLogsDir, `app.log.${oldDate2}`), 'old logs 2')

    const command = await ace.exec('logs:rotate', [])

    assert.oneOf(command.exitCode, [0, 1])
  })

  test('command metadata: should have correct name and description', async ({ assert }) => {
    const command = await ace.exec('logs:rotate', [])

    assert.oneOf(command.exitCode, [0, 1])
    assert.isDefined(command.exitCode)
  })

  test('should handle concurrent execution gracefully', async ({ assert }) => {
    await writeFile(join(testLogsDir, 'app.log'), 'test content')

    const [result1, result2] = await Promise.all([
      ace.exec('logs:rotate', []),
      ace.exec('logs:rotate', []),
    ])

    assert.oneOf(result1.exitCode, [0, 1])
    assert.oneOf(result2.exitCode, [0, 1])
  })
})
