import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { createReadStream, createWriteStream } from 'node:fs'
import { stat, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { StorageAdapter, BackupMetadata } from '#backup/contracts/storage_adapter'
import logger from '@adonisjs/core/services/logger'

/**
 * S3 storage adapter configuration
 */
export interface S3Config {
  bucket: string
  region: string
  endpoint?: string
  accessKeyId: string
  secretAccessKey: string
  path: string
}

/**
 * S3 (or S3-compatible) storage adapter
 * Works with AWS S3, Wasabi, Backblaze B2, MinIO, etc.
 */
export default class S3StorageAdapter implements StorageAdapter {
  readonly name = 's3'
  private client: S3Client

  constructor(private config: S3Config) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  /**
   * Check if S3 storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        MaxKeys: 1,
      })

      await this.client.send(command)
      return true
    } catch (error) {
      logger.error('S3 storage not available', { error: error.message })
      return false
    }
  }

  /**
   * Upload a backup file to S3
   */
  async upload(localPath: string, remotePath: string): Promise<boolean> {
    try {
      const fileStream = createReadStream(localPath)
      const fileStat = await stat(localPath)
      const key = this.getFullPath(remotePath)

      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.config.bucket,
          Key: key,
          Body: fileStream,
          ContentType: 'application/octet-stream',
          ContentLength: fileStat.size,
        },
      })

      await upload.done()

      logger.info('Backup uploaded to S3', {
        localPath,
        bucket: this.config.bucket,
        key,
      })

      return true
    } catch (error) {
      logger.error('Failed to upload backup to S3', {
        localPath,
        remotePath,
        error: error.message,
      })
      return false
    }
  }

  /**
   * Download a backup file from S3
   */
  async download(remotePath: string, localPath: string): Promise<boolean> {
    try {
      const key = this.getFullPath(remotePath)

      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })

      const response = await this.client.send(command)

      if (!response.Body) {
        throw new Error('Empty response body from S3')
      }

      await mkdir(dirname(localPath), { recursive: true })

      const writeStream = createWriteStream(localPath)
      await pipeline(response.Body as any, writeStream)

      logger.info('Backup downloaded from S3', {
        bucket: this.config.bucket,
        key,
        localPath,
      })

      return true
    } catch (error) {
      logger.error('Failed to download backup from S3', {
        remotePath,
        localPath,
        error: error.message,
      })
      return false
    }
  }

  /**
   * Delete a backup file from S3
   */
  async delete(remotePath: string): Promise<boolean> {
    try {
      const key = this.getFullPath(remotePath)

      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })

      await this.client.send(command)

      logger.info('Backup deleted from S3', {
        bucket: this.config.bucket,
        key,
      })

      return true
    } catch (error) {
      logger.error('Failed to delete backup from S3', {
        remotePath,
        error: error.message,
      })
      return false
    }
  }

  /**
   * List all backups in S3
   */
  async list(): Promise<BackupMetadata[]> {
    try {
      const prefix = this.config.path ? `${this.config.path}/` : ''
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
      })

      const response = await this.client.send(command)
      const backups: BackupMetadata[] = []

      if (!response.Contents) return backups

      for (const object of response.Contents) {
        if (!object.Key || !object.LastModified || !object.Size) continue

        const filename = object.Key.replace(prefix, '')

        const match = filename.match(/backup-(full|differential)-(\d{4}-\d{2}-\d{2})-(\d{6})/)
        if (!match) continue

        backups.push({
          filename,
          type: match[1] as 'full' | 'differential',
          size: object.Size,
          createdAt: object.LastModified,
          path: object.Key,
        })
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      logger.error('Failed to list backups from S3', {
        error: error.message,
      })
      return []
    }
  }

  /**
   * Check if a backup exists in S3
   */
  async exists(remotePath: string): Promise<boolean> {
    try {
      const key = this.getFullPath(remotePath)

      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })

      await this.client.send(command)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get free space (not applicable for S3)
   */
  async getFreeSpace(): Promise<number | null> {
    return null
  }

  /**
   * Get full S3 key path
   */
  private getFullPath(filename: string): string {
    return this.config.path ? `${this.config.path}/${filename}` : filename
  }
}
