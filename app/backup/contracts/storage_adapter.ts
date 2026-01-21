/**
 * Backup metadata
 */
export interface BackupMetadata {
  filename: string
  type: 'full' | 'differential'
  size: number
  createdAt: Date
  path?: string
}

/**
 * Storage adapter interface
 * All storage providers must implement this interface
 */
export interface StorageAdapter {
  /**
   * Storage provider name
   */
  readonly name: string

  /**
   * Check if storage is properly configured and available
   */
  isAvailable(): Promise<boolean>

  /**
   * Upload a backup file to storage
   *
   * @param localPath - Path to local backup file
   * @param remotePath - Remote path/key for the backup
   * @returns True if upload succeeded
   */
  upload(localPath: string, remotePath: string): Promise<boolean>

  /**
   * Download a backup file from storage
   *
   * @param remotePath - Remote path/key of the backup
   * @param localPath - Local path to save the backup
   * @returns True if download succeeded
   */
  download(remotePath: string, localPath: string): Promise<boolean>

  /**
   * Delete a backup file from storage
   *
   * @param remotePath - Remote path/key of the backup
   * @returns True if deletion succeeded
   */
  delete(remotePath: string): Promise<boolean>

  /**
   * List all backups in storage
   *
   * @returns Array of backup metadata
   */
  list(): Promise<BackupMetadata[]>

  /**
   * Check if a backup exists in storage
   *
   * @param remotePath - Remote path/key of the backup
   * @returns True if backup exists
   */
  exists(remotePath: string): Promise<boolean>

  /**
   * Get free space available in storage (in bytes)
   * Returns null if not applicable
   */
  getFreeSpace(): Promise<number | null>
}
