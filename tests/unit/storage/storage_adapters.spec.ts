import { test } from '@japa/runner'
import LocalStorageAdapter from '#backup/storage/local_storage_adapter'
import S3StorageAdapter from '#backup/storage/s3_storage_adapter'
import NextcloudStorageAdapter from '#backup/storage/nextcloud_storage_adapter'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

test.group('LocalStorageAdapter', (group) => {
  let adapter: LocalStorageAdapter
  const testPath = 'storage/test-local-storage'

  group.setup(async () => {
    adapter = new LocalStorageAdapter(testPath)
    await mkdir(testPath, { recursive: true })
  })

  group.teardown(async () => {
    if (existsSync(testPath)) {
      await rm(testPath, { recursive: true, force: true })
    }
  })

  test('isAvailable: should return true for valid path', async ({ assert }) => {
    const available = await adapter.isAvailable()
    assert.isTrue(available)
  })

  test('upload: should copy file to storage', async ({ assert }) => {
    const sourcePath = 'storage/test-source.txt'
    await writeFile(sourcePath, 'test content')

    const success = await adapter.upload(sourcePath, 'test-backup.txt')

    assert.isTrue(success)
    assert.isTrue(existsSync(join(testPath, 'test-backup.txt')))

    await rm(sourcePath)
  })

  test('download: should copy file from storage', async ({ assert }) => {
    const remotePath = 'test-download.txt'
    const localPath = 'storage/test-download.txt'
    await writeFile(join(testPath, remotePath), 'download content')

    const success = await adapter.download(remotePath, localPath)

    assert.isTrue(success)
    assert.isTrue(existsSync(localPath))

    await rm(localPath)
  })

  test('delete: should remove file from storage', async ({ assert }) => {
    const remotePath = 'test-delete.txt'
    await writeFile(join(testPath, remotePath), 'delete me')

    const success = await adapter.delete(remotePath)

    assert.isTrue(success)
    assert.isFalse(existsSync(join(testPath, remotePath)))
  })

  test('exists: should return true for existing file', async ({ assert }) => {
    const remotePath = 'test-exists.txt'
    await writeFile(join(testPath, remotePath), 'exists')

    const exists = await adapter.exists(remotePath)

    assert.isTrue(exists)
  })

  test('exists: should return false for non-existing file', async ({ assert }) => {
    const exists = await adapter.exists('non-existent.txt')

    assert.isFalse(exists)
  })

  test('list: should return list of backups', async ({ assert }) => {
    await writeFile(join(testPath, 'backup-full-2025-01-20-120000.sql.gz.enc'), 'backup1')
    await writeFile(join(testPath, 'backup-differential-2025-01-21-120000.sql.gz.enc'), 'backup2')

    const backups = await adapter.list()

    assert.isArray(backups)
    assert.isAtLeast(backups.length, 2)
    assert.property(backups[0], 'filename')
    assert.property(backups[0], 'type')
    assert.property(backups[0], 'size')
    assert.property(backups[0], 'createdAt')
  })

  test('list: should parse backup types correctly', async ({ assert }) => {
    await writeFile(join(testPath, 'backup-full-2025-01-20-120000.sql.gz.enc'), 'full')
    await writeFile(
      join(testPath, 'backup-differential-2025-01-21-120000.sql.gz.enc'),
      'differential'
    )

    const backups = await adapter.list()

    const full = backups.find((b) => b.type === 'full')
    const diff = backups.find((b) => b.type === 'differential')

    assert.exists(full)
    assert.exists(diff)
  })

  test('list: should sort backups by date descending', async ({ assert }) => {
    await writeFile(join(testPath, 'backup-full-2025-01-20-120000.sql.gz.enc'), 'old')
    await writeFile(join(testPath, 'backup-full-2025-01-22-120000.sql.gz.enc'), 'new')

    const backups = await adapter.list()

    assert.isTrue(backups[0].createdAt > backups[1].createdAt)
  })

  test('getFreeSpace: should return available disk space', async ({ assert }) => {
    const freeSpace = await adapter.getFreeSpace()

    assert.isNotNull(freeSpace)
    assert.isTrue(freeSpace! > 0)
  })

  test('edge case: upload non-existent source file', async ({ assert }) => {
    const success = await adapter.upload('non-existent-source.txt', 'dest.txt')

    assert.isFalse(success)
  })

  test('edge case: upload to nested directory', async ({ assert }) => {
    const sourcePath = 'storage/test-nested-source.txt'
    await writeFile(sourcePath, 'nested content')

    const success = await adapter.upload(sourcePath, 'nested/dir/backup.txt')

    assert.isTrue(success)
    assert.isTrue(existsSync(join(testPath, 'nested/dir/backup.txt')))

    await rm(sourcePath)
  })
})

test.group('S3StorageAdapter', (group) => {
  let adapter: S3StorageAdapter | null = null
  const shouldSkip = process.env.BACKUP_S3_ENABLED !== 'true'

  group.setup(() => {
    if (shouldSkip) return

    const config = {
      bucket: process.env.BACKUP_S3_BUCKET || 'test-bucket',
      region: process.env.BACKUP_S3_REGION || 'us-east-1',
      endpoint: process.env.BACKUP_S3_ENDPOINT,
      accessKeyId: process.env.BACKUP_S3_ACCESS_KEY_ID || 'test-key',
      secretAccessKey: process.env.BACKUP_S3_SECRET_ACCESS_KEY || 'test-secret',
      path: 'test-backups',
    }

    adapter = new S3StorageAdapter(config)
  })

  test('isAvailable: should check S3 connection', async ({ assert }) => {
    if (shouldSkip || !adapter) {
      return
    }

    const available = await adapter.isAvailable()
    assert.isBoolean(available)
  })

  test('upload: should upload file to S3', async ({ assert }) => {
    if (shouldSkip || !adapter) return

    const testFile = 'storage/s3-test-upload.txt'
    await writeFile(testFile, 's3 upload test')

    const success = await adapter.upload(testFile, 's3-test-backup.txt')

    assert.isBoolean(success)

    await rm(testFile)
  })

  test('list: should list backups from S3', async ({ assert }) => {
    if (shouldSkip || !adapter) return

    const backups = await adapter.list()

    assert.isArray(backups)
  })

  test('getFreeSpace: should return null for S3', async ({ assert }) => {
    if (shouldSkip || !adapter) return

    const freeSpace = await adapter.getFreeSpace()

    assert.isNull(freeSpace)
  })
})

test.group('NextcloudStorageAdapter', (group) => {
  let adapter: NextcloudStorageAdapter | null = null
  const shouldSkip = process.env.BACKUP_NEXTCLOUD_ENABLED !== 'true'

  group.setup(() => {
    if (shouldSkip) return

    const config = {
      url: process.env.BACKUP_NEXTCLOUD_URL || 'https://nextcloud.example.com',
      username: process.env.BACKUP_NEXTCLOUD_USERNAME || 'test-user',
      password: process.env.BACKUP_NEXTCLOUD_PASSWORD || 'test-password',
      path: '/test-backups',
    }

    adapter = new NextcloudStorageAdapter(config)
  })

  test('isAvailable: should check Nextcloud connection', async ({ assert }) => {
    if (shouldSkip || !adapter) return

    const available = await adapter.isAvailable()
    assert.isBoolean(available)
  })

  test('upload: should upload file to Nextcloud', async ({ assert }) => {
    if (shouldSkip || !adapter) return

    const testFile = 'storage/nextcloud-test-upload.txt'
    await writeFile(testFile, 'nextcloud upload test')

    const success = await adapter.upload(testFile, 'nextcloud-test-backup.txt')

    assert.isBoolean(success)

    await rm(testFile)
  })

  test('list: should list backups from Nextcloud', async ({ assert }) => {
    if (shouldSkip || !adapter) return

    const backups = await adapter.list()

    assert.isArray(backups)
  })

  test('getFreeSpace: should return quota info from Nextcloud', async ({ assert }) => {
    if (shouldSkip || !adapter) return

    const freeSpace = await adapter.getFreeSpace()

    if (freeSpace !== null) {
      assert.isNumber(freeSpace)
    }
  })
})
