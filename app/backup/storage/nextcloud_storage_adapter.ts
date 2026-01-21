import { createClient, WebDAVClient, FileStat, DiskQuota } from 'webdav'
import { createReadStream, createWriteStream } from 'node:fs'
import { stat, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { StorageAdapter, BackupMetadata } from '#backup/contracts/storage_adapter'
import logger from '@adonisjs/core/services/logger'

/**
 * Nextcloud storage adapter configuration
 */
export interface NextcloudConfig {
  url: string
  username: string
  password: string
  path: string
}

/**
 * Nextcloud (WebDAV) storage adapter
 * Supports Nextcloud, ownCloud, and any WebDAV server
 */
export default class NextcloudStorageAdapter implements StorageAdapter {
  readonly name = 'nextcloud'
  private client: WebDAVClient

  constructor(private config: NextcloudConfig) {
    const baseUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url
    const davUrl = `${baseUrl}/remote.php/dav/files/${config.username}`

    this.client = createClient(davUrl, {
      username: config.username,
      password: config.password,
    })
  }

  /**
   * Check if Nextcloud storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const exists = await this.client.exists(this.config.path)

      if (!exists) {
        await this.client.createDirectory(this.config.path, { recursive: true })
      }

      return true
    } catch (error) {
      logger.error('Nextcloud storage not available', { error: error.message })
      return false
    }
  }

  /**
   * Upload a backup file to Nextcloud
   */
  async upload(localPath: string, remotePath: string): Promise<boolean> {
    try {
      const fileStream = createReadStream(localPath)
      const fileStat = await stat(localPath)
      const fullPath = this.getFullPath(remotePath)

      const dir = dirname(fullPath)
      const dirExists = await this.client.exists(dir)
      if (!dirExists) {
        await this.client.createDirectory(dir, { recursive: true })
      }

      await this.client.putFileContents(fullPath, fileStream, {
        contentLength: fileStat.size,
        overwrite: true,
      })

      logger.info('Backup uploaded to Nextcloud', {
        localPath,
        remotePath: fullPath,
      })

      return true
    } catch (error) {
      logger.error('Failed to upload backup to Nextcloud', {
        localPath,
        remotePath,
        error: error.message,
      })
      return false
    }
  }

  /**
   * Download a backup file from Nextcloud
   */
  async download(remotePath: string, localPath: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(remotePath)

      const fileStream = this.client.createReadStream(fullPath)

      await mkdir(dirname(localPath), { recursive: true })

      const writeStream = createWriteStream(localPath)
      await pipeline(fileStream, writeStream)

      logger.info('Backup downloaded from Nextcloud', {
        remotePath: fullPath,
        localPath,
      })

      return true
    } catch (error) {
      logger.error('Failed to download backup from Nextcloud', {
        remotePath,
        localPath,
        error: error.message,
      })
      return false
    }
  }

  /**
   * Delete a backup file from Nextcloud
   */
  async delete(remotePath: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(remotePath)
      await this.client.deleteFile(fullPath)

      logger.info('Backup deleted from Nextcloud', {
        remotePath: fullPath,
      })

      return true
    } catch (error) {
      logger.error('Failed to delete backup from Nextcloud', {
        remotePath,
        error: error.message,
      })
      return false
    }
  }

  /**
   * List all backups in Nextcloud
   */
  async list(): Promise<BackupMetadata[]> {
    try {
      const contents = await this.client.getDirectoryContents(this.config.path, {
        deep: true,
      })

      const backups: BackupMetadata[] = []

      for (const item of contents as FileStat[]) {
        if (item.type !== 'file') continue

        const filename = item.basename

        const match = filename.match(/backup-(full|differential)-(\d{4}-\d{2}-\d{2})-(\d{6})/)
        if (!match) continue

        backups.push({
          filename,
          type: match[1] as 'full' | 'differential',
          size: item.size,
          createdAt: new Date(item.lastmod),
          path: item.filename,
        })
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      logger.error('Failed to list backups from Nextcloud', {
        error: error.message,
      })
      return []
    }
  }

  /**
   * Check if a backup exists in Nextcloud
   */
  async exists(remotePath: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(remotePath)
      return await this.client.exists(fullPath)
    } catch (error) {
      return false
    }
  }

  /**
   * Get free space (not reliably available via WebDAV)
   */
  async getFreeSpace(): Promise<number | null> {
    try {
      const quota = (await this.client.getQuota()) as DiskQuota
      if (quota && typeof quota.available === 'number') {
        return quota.available
      }
      return null
    } catch (error) {
      logger.warn('Failed to get free space from Nextcloud', {
        error: error.message,
      })
      return null
    }
  }

  /**
   * Get full Nextcloud path
   */
  private getFullPath(filename: string): string {
    return `${this.config.path}/${filename}`.replace(/\/+/g, '/')
  }
}
