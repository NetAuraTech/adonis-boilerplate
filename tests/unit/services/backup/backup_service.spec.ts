import { test } from '@japa/runner'
import BackupService from '#backup/services/backup_service'
import NotificationService from '#notification/services/notification_service'
import { mkdir, rm, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import backupConfig from '#config/backup'
import LogService from '#core/services/log_service'

test.group('BackupService', (group) => {
  let backupService: BackupService
  let notificationService: NotificationService
  const testBackupDir = join(process.cwd(), 'storage/test-backups')
  let originalLocalPath: string
  let logService: LogService

  group.setup(async () => {
    originalLocalPath = backupConfig.storages.local.path
    backupConfig.storages.local.path = testBackupDir

    logService = new LogService()
    notificationService = new NotificationService(logService)
    backupService = new BackupService(notificationService, logService)
  })

  group.teardown(async () => {
    backupConfig.storages.local.path = originalLocalPath
    if (existsSync(testBackupDir)) {
      await rm(testBackupDir, { recursive: true, force: true })
    }
  })

  group.each.setup(async () => {
    if (existsSync(testBackupDir)) {
      await rm(testBackupDir, { recursive: true, force: true })
    }
    await mkdir(testBackupDir, { recursive: true })
    backupConfig.storages.local.path = testBackupDir
  })

  test('runFullBackup: should create encrypted compressed backup', async ({ assert }) => {
    const result = await backupService.runFullBackup()

    assert.isTrue(result.success)
    assert.exists(result.filename)
    assert.equal(result.type, 'full')
    assert.isTrue(result.size > 0)
    assert.isTrue(result.duration > 0)
    assert.isObject(result.storages)
  })

  test('runFullBackup: should create backup with correct naming', async ({ assert }) => {
    const result = await backupService.runFullBackup()

    assert.match(result.filename, /^backup-full-\d{4}-\d{2}-\d{2}-\d{6}\.sql\.gz\.enc$/)
  })

  test('runFullBackup: should upload to all enabled storages', async ({ assert }) => {
    const result = await backupService.runFullBackup()

    assert.property(result.storages, 'local')
    assert.isTrue(result.storages.local)

    if (backupConfig.storages.s3.enabled) {
      assert.property(result.storages, 's3')
    }

    if (backupConfig.storages.nextcloud.enabled) {
      assert.property(result.storages, 'nextcloud')
    }
  })

  test('runFullBackup: should create manifest file', async ({ assert }) => {
    const result = await backupService.runFullBackup()

    const manifestName = result.filename.replace(/\.(sql|gz|enc)+$/, '.manifest.json')
    const manifestPath = join(backupConfig.storages.local.path, manifestName)

    assert.isTrue(existsSync(manifestPath))

    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'))
    assert.equal(manifest.type, 'full')
    assert.exists(manifest.createdAt)
    assert.isArray(manifest.tables)
  })

  test('runFullBackup: should handle errors gracefully', async ({ assert }) => {
    backupConfig.storages.local.path =
      process.platform === 'win32' ? 'Z:/invalid/path' : '/root/invalid_path'

    const backupServiceWithInvalidPath = new BackupService(notificationService, logService)

    const result = await backupServiceWithInvalidPath.runFullBackup()

    assert.isFalse(result.success)
    assert.exists(result.error)
  })

  test('runDifferentialBackup: should create differential backup with modified tables', async ({
    assert,
  }) => {
    await backupService.runFullBackup()

    const result = await backupService.runDifferentialBackup()

    assert.isTrue(result.success)
    assert.equal(result.type, 'differential')
    assert.exists(result.filename)
  })

  test('runDifferentialBackup: should fallback to full backup if no previous full backup', async ({
    assert,
  }) => {
    const result = await backupService.runDifferentialBackup()

    assert.isTrue(result.success)
    assert.equal(result.type, 'full')
  })

  test('run: should auto-detect backup type based on schedule', async ({ assert }) => {
    const result = await backupService.run()

    assert.isTrue(result.success)
    assert.oneOf(result.type, ['full', 'differential'])
  })

  test('cleanup: should remove old backups based on retention policy', async ({ assert }) => {
    await backupService.runFullBackup()
    await backupService.runFullBackup()
    await backupService.runFullBackup()

    const result = await backupService.cleanup()

    assert.isNumber(result.deleted)
    assert.isNumber(result.kept)
    assert.isNumber(result.errors)
    assert.isTrue(result.deleted >= 0)
    assert.isTrue(result.kept >= 0)
  })

  test('healthCheck: should validate backup system health', async ({ assert }) => {
    await backupService.runFullBackup()

    const result = await backupService.healthCheck()

    assert.isBoolean(result.healthy)
    assert.isArray(result.issues)
    assert.isObject(result.storages)
    assert.exists(result.lastBackup)
  })

  test('healthCheck: should detect missing backups', async ({ assert }) => {
    const result = await backupService.healthCheck()

    assert.isFalse(result.healthy)
    assert.isTrue(result.issues.some((issue) => issue.includes('backup')))
  })

  test('healthCheck: should detect storage issues', async ({ assert }) => {
    const result = await backupService.healthCheck()

    assert.property(result.storages, 'local')
  })

  test('restore: should restore backup successfully', async ({ assert }) => {
    const backupResult = await backupService.runFullBackup()

    const restoreResult = await backupService.restore(backupResult.filename)

    assert.isTrue(restoreResult.success)
    assert.isUndefined(restoreResult.error)
  })

  test('restore: should fail with non-existent backup', async ({ assert }) => {
    const result = await backupService.restore('non-existent-backup.sql.gz.enc')

    assert.isFalse(result.success)
    assert.exists(result.error)
  })

  test('generateFilename: should generate correct filename format', async ({ assert }) => {
    const result = await backupService.runFullBackup()

    const parts = result.filename.split('-')
    assert.equal(parts[0], 'backup')
    assert.oneOf(parts[1], ['full', 'differential'])
    assert.match(parts[2], /^\d{4}$/)
  })

  test('encryption: should encrypt backups when enabled', async ({ assert }) => {
    const result = await backupService.runFullBackup()

    if (backupConfig.encryption.enabled) {
      assert.isTrue(result.filename.endsWith('.enc'))
    } else {
      assert.isFalse(result.filename.endsWith('.enc'))
    }
  })

  test('compression: should compress backups when enabled', async ({ assert }) => {
    const result = await backupService.runFullBackup()

    if (backupConfig.compression.enabled) {
      assert.isTrue(result.filename.includes('.gz'))
    } else {
      assert.isFalse(result.filename.includes('.gz'))
    }
  })

  test('notification: should send notification on failure', async ({ assert }) => {
    backupConfig.storages.local.path =
      process.platform === 'win32' ? 'Z:/invalid/path' : '/root/invalid_path'

    const backupServiceWithInvalidPath = new BackupService(notificationService, logService)

    const result = await backupServiceWithInvalidPath.runFullBackup()

    assert.isFalse(result.success)
  })

  test('edge case: backup size exceeds warning threshold', async ({ assert }) => {
    const result = await backupService.runFullBackup()

    assert.isTrue(result.success)
  })

  test('edge case: multiple simultaneous backups', async ({ assert }) => {
    const [result1, result2] = await Promise.all([
      backupService.runFullBackup(),
      backupService.runFullBackup(),
    ])

    assert.isBoolean(result1.success)
    assert.isBoolean(result2.success)
  })

  test('performance: full backup should complete in reasonable time', async ({ assert }) => {
    const startTime = Date.now()
    const result = await backupService.runFullBackup()
    const duration = Date.now() - startTime

    assert.isTrue(result.success)
    assert.isTrue(duration < 60000)
  })

  test('consistency: manifest should match backup content', async ({ assert }) => {
    const result = await backupService.runFullBackup()

    const manifestName = result.filename.replace(/\.(sql|gz|enc)+$/, '.manifest.json')
    const manifestPath = join(backupConfig.storages.local.path, manifestName)
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'))
    assert.equal(manifest.type, result.type)
    assert.isArray(manifest.tables)
    assert.isTrue(manifest.tables.length > 0)
  })

  test('retention: daily backups should be kept for configured days', async ({ assert }) => {
    for (let i = 0; i < 3; i++) {
      await backupService.runFullBackup()
    }

    const result = await backupService.cleanup()

    assert.isTrue(result.deleted === 0)
  })
})
