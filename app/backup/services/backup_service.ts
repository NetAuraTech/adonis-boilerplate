import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import backupConfig from '#config/backup'
import { createEncryptionHelper } from '#core/helpers/encryption'
import LocalStorageAdapter from '#backup/storage/local_storage_adapter'
import S3StorageAdapter from '#backup/storage/s3_storage_adapter'
import NextcloudStorageAdapter from '#backup/storage/nextcloud_storage_adapter'
import NotificationService from '#notification/services/notification_service'
import type { BackupMetadata, StorageAdapter } from '#backup/contracts/storage_adapter'
import { spawn } from 'node:child_process'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createGunzip, createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { DateTime } from 'luxon'
import env from '#start/env'

export interface BackupResult {
  success: boolean
  filename: string
  type: 'full' | 'differential'
  size: number
  duration: number
  storages: {
    [key: string]: boolean
  }
  error?: string
}

export interface BackupManifest {
  type: 'full' | 'differential'
  createdAt: string
  tables: string[]
  fullBackupReference?: string
}

@inject()
export default class BackupService {
  private storages: StorageAdapter[] = []
  private encryptionHelper = createEncryptionHelper(backupConfig.encryption.key)
  private tempDir = 'storage/temp/backups'

  constructor(protected notificationService: NotificationService) {
    this.initializeStorages()
  }

  /**
   * Initialize storage adapters based on configuration
   */
  private initializeStorages(): void {
    // Local storage (always enabled)
    if (backupConfig.storages.local.enabled) {
      this.storages.push(new LocalStorageAdapter(backupConfig.storages.local.path))
    }

    // S3 storage (if enabled)
    if (backupConfig.storages.s3.enabled) {
      this.storages.push(
        new S3StorageAdapter({
          bucket: backupConfig.storages.s3.bucket,
          region: backupConfig.storages.s3.region,
          endpoint: backupConfig.storages.s3.endpoint || undefined,
          accessKeyId: backupConfig.storages.s3.accessKeyId,
          secretAccessKey: backupConfig.storages.s3.secretAccessKey,
          path: backupConfig.storages.s3.path,
        })
      )
    }

    // Nextcloud storage (if enabled)
    if (backupConfig.storages.nextcloud.enabled) {
      this.storages.push(
        new NextcloudStorageAdapter({
          url: backupConfig.storages.nextcloud.url,
          username: backupConfig.storages.nextcloud.username,
          password: backupConfig.storages.nextcloud.password,
          path: backupConfig.storages.nextcloud.path,
        })
      )
    }

    logger.info('Backup storage adapters initialized', {
      storages: this.storages.map((s) => s.name),
    })
  }

  /**
   * Run a backup (auto-detects type based on day of week)
   */
  async run(): Promise<BackupResult> {
    const today = DateTime.now()
    const isFullBackupDay = today.weekday === backupConfig.schedule.fullBackupDay

    return isFullBackupDay ? this.runFullBackup() : this.runDifferentialBackup()
  }

  /**
   * Run a full database backup
   */

  async runFullBackup(): Promise<BackupResult> {
    const startTime = Date.now()
    const filename = this.generateFilename('full')
    const tempPath = join(this.tempDir, filename)

    logger.info('Starting full backup', { filename })

    try {
      // Ensure temp directory exists
      await mkdir(this.tempDir, { recursive: true })

      // Step 1: Create database dump
      //const dumpPath = join(this.tempDir, `${filename.split('.')[0]}.sql`)
      const dumpPath = tempPath.replace(/\.(gz\.enc|enc|gz)$/, '.sql')
      await this.createDatabaseDump(dumpPath)

      // Step 2: Compress
      const compressedPath = await this.compressFile(dumpPath)
      await unlink(dumpPath)

      // Step 3: Encrypt
      const encryptedPath = await this.encryptFile(compressedPath)

      // Step 4: Get file size
      const fileStats = await stat(encryptedPath)
      const size = fileStats.size

      // Step 5: Create manifest
      const tables = await this.getAllTables()
      await this.createManifest(filename, {
        type: 'full',
        createdAt: new Date().toISOString(),
        tables,
      })

      // Step 6: Upload to all storages
      const storageResults = await this.uploadToStorages(encryptedPath, filename)

      // Step 7: Cleanup temp file
      await unlink(encryptedPath)

      const duration = Date.now() - startTime

      logger.info('Full backup completed', {
        filename,
        size,
        duration,
        storages: storageResults,
      })

      // Step 8: Check if backup is too large
      if (size > backupConfig.health.maxBackupSize * 1024 * 1024) {
        await this.notifyLargeBackup(filename, size)
      }

      // Step 9: Notify success (if configured)
      if (backupConfig.notifications.onSuccess) {
        await this.notifySuccess(filename, size, duration)
      }

      return {
        success: true,
        filename,
        type: 'full',
        size,
        duration,
        storages: storageResults,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      logger.error('Full backup failed', {
        filename,
        error: error.message,
        stack: error.stack,
      })

      await this.notifyFailure(filename, error)

      return {
        success: false,
        filename,
        type: 'full',
        size: 0,
        duration,
        storages: {},
        error: error.message,
      }
    }
  }

  /**
   * Run a differential backup (only modified tables)
   */
  async runDifferentialBackup(): Promise<BackupResult> {
    const startTime = Date.now()
    const filename = this.generateFilename('differential')
    const tempPath = join(this.tempDir, filename)

    logger.info('Starting differential backup', { filename })

    try {
      // Ensure temp directory exists
      await mkdir(this.tempDir, { recursive: true })

      // Step 1: Find last full backup
      const lastFullBackup = await this.findLastFullBackup()
      if (!lastFullBackup) {
        logger.warn('No full backup found, running full backup instead')
        return this.runFullBackup()
      }

      // Step 2: Get modified tables since last full backup
      const modifiedTables = await this.getModifiedTables(lastFullBackup.createdAt)

      if (modifiedTables.length === 0) {
        logger.info('No tables modified since last backup, skipping')
        return {
          success: true,
          filename: '',
          type: 'differential',
          size: 0,
          duration: Date.now() - startTime,
          storages: {},
        }
      }

      logger.info('Found modified tables', {
        count: modifiedTables.length,
        tables: modifiedTables,
      })

      // Step 3: Create differential dump
      const dumpPath = tempPath.replace(/\.(gz\.enc|enc|gz)$/, '.sql')
      await this.createDifferentialDump(dumpPath, modifiedTables)

      // Step 4: Compress
      const compressedPath = await this.compressFile(dumpPath)
      await unlink(dumpPath)

      // Step 5: Encrypt
      const encryptedPath = await this.encryptFile(compressedPath)

      // Step 6: Get file size
      const { size } = require('node:fs').statSync(encryptedPath)

      // Step 7: Create manifest
      await this.createManifest(filename, {
        type: 'differential',
        createdAt: new Date().toISOString(),
        tables: modifiedTables,
        fullBackupReference: lastFullBackup.filename,
      })

      // Step 8: Upload to all storages
      const storageResults = await this.uploadToStorages(encryptedPath, filename)

      // Step 9: Cleanup temp file
      await unlink(encryptedPath)

      const duration = Date.now() - startTime

      logger.info('Differential backup completed', {
        filename,
        size,
        duration,
        tables: modifiedTables.length,
        storages: storageResults,
      })

      return {
        success: true,
        filename,
        type: 'differential',
        size,
        duration,
        storages: storageResults,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      logger.error('Differential backup failed', {
        filename,
        error: error.message,
        stack: error.stack,
      })

      await this.notifyFailure(filename, error)

      return {
        success: false,
        filename,
        type: 'differential',
        size: 0,
        duration,
        storages: {},
        error: error.message,
      }
    }
  }

  /**
   * Create a full database dump using pg_dump
   */
  private async createDatabaseDump(outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-h',
        env.get('DB_HOST'),
        '-p',
        String(env.get('DB_PORT') || 5432),
        '-U',
        env.get('DB_USER'),
        '-d',
        env.get('DB_DATABASE'),
        '-F',
        'p', // Plain format
        '-f',
        outputPath,
      ]

      const pgDump = spawn('pg_dump', args, {
        env: {
          ...process.env,
          PGPASSWORD: env.get('DB_PASSWORD'),
        },
      })

      let errorOutput = ''

      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`))
        }
      })

      pgDump.on('error', (error) => {
        reject(new Error(`Failed to start pg_dump: ${error.message}`))
      })
    })
  }

  /**
   * Create a differential dump (specific tables only)
   */
  private async createDifferentialDump(outputPath: string, tables: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-h',
        env.get('DB_HOST'),
        '-p',
        String(env.get('DB_PORT') || 5432),
        '-U',
        env.get('DB_USER'),
        '-d',
        env.get('DB_DATABASE'),
        '-F',
        'p', // Plain format
        '-f',
        outputPath,
      ]

      // Add each table to dump
      for (const table of tables) {
        args.push('-t', table)
      }

      const pgDump = spawn('pg_dump', args, {
        env: {
          ...process.env,
          PGPASSWORD: env.get('DB_PASSWORD'),
        },
      })

      let errorOutput = ''

      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`))
        }
      })

      pgDump.on('error', (error) => {
        reject(new Error(`Failed to start pg_dump: ${error.message}`))
      })
    })
  }

  /**
   * Compress a file using gzip
   */
  private async compressFile(inputPath: string): Promise<string> {
    const outputPath = `${inputPath}.gz`
    const input = createReadStream(inputPath)
    const output = createWriteStream(outputPath)
    const gzip = createGzip({ level: backupConfig.compression.level })

    await pipeline(input, gzip, output)

    return outputPath
  }

  /**
   * Decompress a file using gzip
   */
  private async decompressFile(inputPath: string, outputPath: string): Promise<void> {
    const input = createReadStream(inputPath)
    const output = createWriteStream(outputPath)
    const gunzip = createGunzip()

    await pipeline(input, gunzip, output)
  }

  /**
   * Encrypt a file
   */
  private async encryptFile(inputPath: string): Promise<string> {
    if (!backupConfig.encryption.enabled) {
      return inputPath
    }

    const outputPath = `${inputPath}.enc`
    await this.encryptionHelper.encryptFile(inputPath, outputPath)
    await unlink(inputPath)

    return outputPath
  }

  /**
   * Decrypt a file
   */
  private async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    if (!backupConfig.encryption.enabled) {
      return
    }

    await this.encryptionHelper.decryptFile(inputPath, outputPath)
  }

  /**
   * Upload backup to all configured storages
   */
  private async uploadToStorages(
    localPath: string,
    filename: string
  ): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {}

    for (const storage of this.storages) {
      try {
        const available = await storage.isAvailable()
        if (!available) {
          logger.warn('Storage not available', { storage: storage.name })
          results[storage.name] = false
          continue
        }

        results[storage.name] = await storage.upload(localPath, filename)
      } catch (error) {
        logger.error('Failed to upload to storage', {
          storage: storage.name,
          error: error.message,
        })
        results[storage.name] = false
      }
    }

    return results
  }

  /**
   * Generate backup filename
   */
  private generateFilename(type: 'full' | 'differential'): string {
    const now = DateTime.now()
    const date = now.toFormat('yyyy-MM-dd')
    const time = now.toFormat('HHmmss')

    let filename = `backup-${type}-${date}-${time}.sql`

    if (backupConfig.compression.enabled) {
      filename += '.gz'
    }

    if (backupConfig.encryption.enabled) {
      filename += '.enc'
    }

    return filename
  }

  /**
   * Create manifest file for backup
   */
  private async createManifest(filename: string, data: BackupManifest): Promise<void> {
    const manifestFilename = filename.replace(/\.(sql|gz|enc)+$/, '.manifest.json')
    const manifestPath = join(this.tempDir, manifestFilename)

    await writeFile(manifestPath, JSON.stringify(data, null, 2))

    // Upload manifest to all storages
    for (const storage of this.storages) {
      try {
        await storage.upload(manifestPath, manifestFilename)
      } catch (error) {
        logger.error('Failed to upload manifest', {
          storage: storage.name,
          error: error.message,
        })
      }
    }

    await unlink(manifestPath)
  }

  /**
   * Get all database tables
   */
  private async getAllTables(): Promise<string[]> {
    const connection = db.connection(backupConfig.database.connection)
    const result = await connection.rawQuery(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    )

    return result.rows.map((row: any) => row.tablename)
  }

  /**
   * Get tables modified since a specific date
   */
  private async getModifiedTables(since: Date): Promise<string[]> {
    const connection = db.connection(backupConfig.database.connection)

    // Query pg_stat_user_tables to find modified tables
    const result = await connection.rawQuery(
      `
      SELECT
        schemaname || '.' || relname as table_name,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE
        schemaname = 'public'
        AND (
          last_vacuum > ? OR
          last_autovacuum > ? OR
          last_analyze > ? OR
          last_autoanalyze > ?
        )
      ORDER BY relname
      `,
      [since, since, since, since]
    )

    const modifiedFromStats = result.rows.map((row: any) => row.table_name.replace('public.', ''))

    // Also check tables with updated_at column
    const allTables = await this.getAllTables()
    const modifiedFromUpdatedAt: string[] = []

    for (const table of allTables) {
      // Skip excluded tables
      if (backupConfig.differential.excludedTables.includes(table)) {
        continue
      }

      try {
        const hasUpdatedAt = await connection.rawQuery(
          `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = ?
            AND column_name = 'updated_at'
          `,
          [table]
        )

        if (hasUpdatedAt.rows.length > 0) {
          const hasModified = await connection.rawQuery(
            `SELECT 1 FROM "${table}" WHERE updated_at > ? LIMIT 1`,
            [since]
          )

          if (hasModified.rows.length > 0) {
            modifiedFromUpdatedAt.push(table)
          }
        }
      } catch (error) {
        logger.warn('Failed to check table for modifications', {
          table,
          error: error.message,
        })
      }
    }

    // Merge both sources and deduplicate

    return [...new Set([...modifiedFromStats, ...modifiedFromUpdatedAt])]
  }

  /**
   * Find the last full backup
   */
  private async findLastFullBackup(): Promise<BackupMetadata | null> {
    // Try to get from local storage first
    const localStorage = this.storages.find((s) => s.name === 'local')
    if (!localStorage) return null

    const backups = await localStorage.list()
    const fullBackups = backups.filter((b) => b.type === 'full')

    if (fullBackups.length === 0) return null

    // Return most recent
    return fullBackups[0]
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanup(): Promise<{
    deleted: number
    kept: number
    errors: number
  }> {
    logger.info('Starting backup cleanup')

    let deleted = 0
    let kept = 0
    let errors = 0

    for (const storage of this.storages) {
      try {
        const backups = await storage.list()
        const toDelete = this.getBackupsToDelete(backups)

        for (const backup of toDelete) {
          try {
            const success = await storage.delete(backup.filename)
            if (success) {
              deleted++
              logger.info('Backup deleted', {
                storage: storage.name,
                filename: backup.filename,
              })
            } else {
              errors++
            }
          } catch (error) {
            errors++
            logger.error('Failed to delete backup', {
              storage: storage.name,
              filename: backup.filename,
              error: error.message,
            })
          }
        }

        kept += backups.length - toDelete.length
      } catch (error) {
        logger.error('Failed to cleanup storage', {
          storage: storage.name,
          error: error.message,
        })
      }
    }

    logger.info('Backup cleanup completed', { deleted, kept, errors })

    return { deleted, kept, errors }
  }

  /**
   * Determine which backups should be deleted based on retention policy
   */
  private getBackupsToDelete(backups: BackupMetadata[]): BackupMetadata[] {
    const now = DateTime.now()
    const toKeep = new Set<string>()

    // Sort by date (newest first)
    const sorted = [...backups].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Keep daily backups
    const dailyBackups = sorted.filter(
      (b) => DateTime.fromJSDate(b.createdAt) > now.minus({ days: backupConfig.retention.daily })
    )
    dailyBackups.forEach((b) => toKeep.add(b.filename))

    // Keep weekly backups (Sundays)
    const weeklyBackups = sorted
      .filter((b) => {
        const date = DateTime.fromJSDate(b.createdAt)
        return (
          date.weekday === 7 && // Sunday
          date > now.minus({ weeks: backupConfig.retention.weekly })
        )
      })
      .slice(0, backupConfig.retention.weekly)
    weeklyBackups.forEach((b) => toKeep.add(b.filename))

    // Keep monthly backups (1st of month)
    const monthlyBackups = sorted
      .filter((b) => {
        const date = DateTime.fromJSDate(b.createdAt)
        return date.day === 1 && date > now.minus({ months: backupConfig.retention.monthly })
      })
      .slice(0, backupConfig.retention.monthly)
    monthlyBackups.forEach((b) => toKeep.add(b.filename))

    // Keep yearly backups (1st January)
    const yearlyBackups = sorted
      .filter((b) => {
        const date = DateTime.fromJSDate(b.createdAt)
        return (
          date.month === 1 &&
          date.day === 1 &&
          date > now.minus({ years: backupConfig.retention.yearly })
        )
      })
      .slice(0, backupConfig.retention.yearly)
    yearlyBackups.forEach((b) => toKeep.add(b.filename))

    // Return backups not in keep set
    return sorted.filter((b) => !toKeep.has(b.filename))
  }

  /**
   * Perform health check on backup system
   */
  async healthCheck(): Promise<{
    healthy: boolean
    issues: string[]
    lastBackup: BackupMetadata | null
    storages: { [key: string]: boolean }
  }> {
    const issues: string[] = []
    const storageStatus: { [key: string]: boolean } = {}

    // Check storage availability
    for (const storage of this.storages) {
      const available = await storage.isAvailable()
      storageStatus[storage.name] = available

      if (!available) {
        issues.push(`Storage ${storage.name} is not available`)
      }

      // Check free space for local storage
      if (storage.name === 'local') {
        const freeSpace = await storage.getFreeSpace()
        if (freeSpace !== null) {
          const freeSpaceGB = freeSpace / (1024 * 1024 * 1024)
          if (freeSpaceGB < backupConfig.health.minFreeSpace) {
            issues.push(
              `Low disk space: ${freeSpaceGB.toFixed(2)}GB (minimum: ${backupConfig.health.minFreeSpace}GB)`
            )
          }
        }
      }
    }

    // Check last backup age
    const localStorage = this.storages.find((s) => s.name === 'local')
    let lastBackup: BackupMetadata | null = null

    if (localStorage) {
      const backups = await localStorage.list()
      if (backups.length > 0) {
        lastBackup = backups[0]

        const hoursSinceLastBackup =
          (Date.now() - lastBackup.createdAt.getTime()) / (1000 * 60 * 60)

        if (hoursSinceLastBackup > backupConfig.health.maxBackupAge) {
          issues.push(
            `Last backup is too old: ${hoursSinceLastBackup.toFixed(1)} hours (max: ${backupConfig.health.maxBackupAge} hours)`
          )
        }
      } else {
        issues.push('No backups found')
      }
    }

    const healthy = issues.length === 0

    if (!healthy && backupConfig.notifications.onHealthCheckFailure) {
      await this.notifyHealthCheckFailure(issues)
    }

    return {
      healthy,
      issues,
      lastBackup,
      storages: storageStatus,
    }
  }

  /**
   * Restore a backup
   */
  async restore(filename: string): Promise<{ success: boolean; error?: string }> {
    logger.info('Starting backup restoration', { filename })

    try {
      // Find backup in storages
      const localStorage = this.storages.find((s) => s.name === 'local')
      if (!localStorage) {
        throw new Error('Local storage not available for restoration')
      }

      const exists = await localStorage.exists(filename)
      if (!exists) {
        throw new Error(`Backup file not found: ${filename}`)
      }

      logger.info('Backup file found')

      // Download to temp
      const tempPath = join(this.tempDir, filename)
      await mkdir(this.tempDir, { recursive: true })

      const success = await localStorage.download(filename, tempPath)
      if (!success) {
        throw new Error('Failed to download backup file')
      }

      // Decrypt
      const decryptedPath = tempPath.replace(/\.enc$/, '')
      console.log(decryptedPath)
      if (backupConfig.encryption.enabled) {
        await this.decryptFile(tempPath, decryptedPath)
        await unlink(tempPath)
      }

      logger.info('Backup file decrypted')

      // Decompress
      const decompressedPath = decryptedPath.replace(/\.gz$/, '')
      if (backupConfig.compression.enabled) {
        await this.decompressFile(decryptedPath, decompressedPath)
        await unlink(decryptedPath)
      }

      logger.info('Backup file decompressed')

      // Restore database
      await this.restoreDatabase(decompressedPath)

      // Cleanup
      await unlink(decompressedPath)

      logger.info('Backup restoration completed', { filename })

      return { success: true }
    } catch (error) {
      logger.error('Backup restoration failed', {
        filename,
        error: error.message,
        stack: error.stack,
      })

      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Restore database from SQL file
   */
  private async restoreDatabase(sqlPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-h',
        env.get('DB_HOST'),
        '-p',
        String(env.get('DB_PORT') || 5432),
        '-U',
        env.get('DB_USER'),
        '-d',
        env.get('DB_DATABASE'),
        '-f',
        sqlPath,
      ]

      const psql = spawn('psql', args, {
        env: {
          ...process.env,
          PGPASSWORD: env.get('DB_PASSWORD'),
        },
      })

      let errorOutput = ''

      psql.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      psql.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`psql failed with code ${code}: ${errorOutput}`))
        }
      })

      psql.on('error', (error) => {
        reject(new Error(`Failed to start psql: ${error.message}`))
      })
    })
  }

  // Notification methods...

  private async notifySuccess(filename: string, size: number, duration: number): Promise<void> {
    // Only log, don't send email for success
    logger.info('Backup completed successfully', { filename, size, duration })
  }

  private async notifyFailure(filename: string, error: Error): Promise<void> {
    if (!backupConfig.notifications.onFailure) return

    logger.error('Sending backup failure notification', { filename })

    // Send notification via NotificationService (will be email)
    await this.notificationService.notify({
      userId: 1, // Admin user - TODO: make configurable
      type: 'error',
      title: 'Backup Failed',
      message: `Database backup failed: ${filename}`,
      data: {
        filename,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    })
  }

  private async notifyLargeBackup(filename: string, size: number): Promise<void> {
    logger.warn('Large backup detected', { filename, size })

    await this.notificationService.notify({
      userId: 1, // Admin user
      type: 'warning',
      title: 'Large Backup Detected',
      message: `Backup ${filename} is unusually large (${(size / 1024 / 1024).toFixed(2)}MB)`,
      data: {
        filename,
        size,
        threshold: backupConfig.health.maxBackupSize,
      },
    })
  }

  private async notifyHealthCheckFailure(issues: string[]): Promise<void> {
    logger.error('Backup health check failed', { issues })

    await this.notificationService.notify({
      userId: 1, // Admin user
      type: 'error',
      title: 'Backup Health Check Failed',
      message: `Backup system has ${issues.length} issue(s)`,
      data: {
        issues,
        timestamp: new Date().toISOString(),
      },
    })
  }
}
