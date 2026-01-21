import { mkdir, copyFile, unlink, stat, readdir, statfs } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import type { StorageAdapter, BackupMetadata } from '#backup/contracts/storage_adapter'
import logger from '@adonisjs/core/services/logger'

/**
 * Local file system storage adapter
 */
export default class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'local'

  constructor(private basePath: string) {}

  /**
   * Check if local storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await mkdir(this.basePath, { recursive: true })
      return true
    } catch (error) {
      logger.error('Local storage not available', { error: error.message })
      return false
    }
  }

  /**
   * Upload (copy) a backup file to local storage
   */
  async upload(localPath: string, remotePath: string): Promise<boolean> {
    try {
      const fullPath = join(this.basePath, remotePath)
      const dir = dirname(fullPath)

      await mkdir(dir, { recursive: true })

      await copyFile(localPath, fullPath)

      logger.info('Backup uploaded to local storage', {
        localPath,
        remotePath: fullPath,
      })

      return true
    } catch (error) {
      logger.error('Failed to upload backup to local storage', {
        localPath,
        remotePath,
        error: error.message,
      })
      return false
    }
  }

  /**
   * Download (copy) a backup file from local storage
   */
  async download(remotePath: string, localPath: string): Promise<boolean> {
    try {
      const fullPath = join(this.basePath, remotePath)
      const dir = dirname(localPath)

      await mkdir(dir, { recursive: true })

      await copyFile(fullPath, localPath)

      logger.info('Backup downloaded from local storage', {
        remotePath: fullPath,
        localPath,
      })

      return true
    } catch (error) {
      logger.error('Failed to download backup from local storage', {
        remotePath,
        localPath,
        error: error.message,
      })
      return false
    }
  }

  /**
   * Delete a backup file from local storage
   */
  async delete(remotePath: string): Promise<boolean> {
    try {
      const fullPath = join(this.basePath, remotePath)
      await unlink(fullPath)

      logger.info('Backup deleted from local storage', {
        remotePath: fullPath,
      })

      return true
    } catch (error) {
      logger.error('Failed to delete backup from local storage', {
        remotePath,
        error: error.message,
      })
      return false
    }
  }

  /**
   * List all backups in local storage
   */
  async list(): Promise<BackupMetadata[]> {
    try {
      const files = await this.scanDirectory(this.basePath)
      const backups: BackupMetadata[] = []

      for (const file of files) {
        const fullPath = join(this.basePath, file)
        const stats = await stat(fullPath)

        const match = file.match(/backup-(full|differential)-(\d{4}-\d{2}-\d{2})-(\d{6})/)
        if (!match) continue

        backups.push({
          filename: file,
          type: match[1] as 'full' | 'differential',
          size: stats.size,
          createdAt: this.parseFilenameDate(match[2], match[3]),
          path: fullPath,
        })
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      logger.error('Failed to list backups from local storage', {
        error: error.message,
      })
      return []
    }
  }

  /**
   * Check if a backup exists in local storage
   */
  async exists(remotePath: string): Promise<boolean> {
    const fullPath = join(this.basePath, remotePath)
    return existsSync(fullPath)
  }

  /**
   * Get free space on local storage (in bytes)
   */
  async getFreeSpace(): Promise<number | null> {
    try {
      const stats = await statfs(this.basePath)
      return stats.bavail * stats.bsize
    } catch (error) {
      logger.error('Failed to get free space from local storage', {
        error: error.message,
      })
      return null
    }
  }

  /**
   * Recursively scan directory for backup files
   */
  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = []

    try {
      const entries = await readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath)
          files.push(...subFiles.map((f) => join(entry.name, f)))
        } else if (entry.name.startsWith('backup-')) {
          files.push(entry.name)
        }
      }
    } catch (error) {
      logger.warn('Failed to scan directory', { dir, error: error.message })
    }

    return files
  }

  /**
   * Parse date from filename
   */
  private parseFilenameDate(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number)
    const hour = Number.parseInt(time.slice(0, 2))
    const minute = Number.parseInt(time.slice(2, 4))
    const second = Number.parseInt(time.slice(4, 6))

    return new Date(year, month - 1, day, hour, minute, second)
  }
}
