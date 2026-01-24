import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import app from '@adonisjs/core/services/app'
import { readdir, stat, rename, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { DateTime } from 'luxon'

export default class RotateLogs extends BaseCommand {
  static commandName = 'logs:rotate'
  static description = 'Rotate log files based on retention policy'

  static options: CommandOptions = {
    startApp: false,
  }

  private logsDir = app.makePath('storage/logs')

  /**
   * Maximum file size in bytes (10MB)
   */
  private maxFileSize = 10 * 1024 * 1024

  /**
   * Maximum age in days
   */
  private maxAgeDays = 30

  /**
   * Maximum number of rotated files to keep
   */
  private maxRotatedFiles = 10

  async run(): Promise<void> {
    this.logger.info('Starting log rotation...')

    try {
      const files = await readdir(this.logsDir)
      const logFiles = files.filter((file) => file.endsWith('.log'))

      let rotatedCount = 0
      let deletedCount = 0

      for (const file of logFiles) {
        const filePath = join(this.logsDir, file)
        const stats = await stat(filePath)

        if (stats.size > this.maxFileSize) {
          await this.rotateFile(filePath)
          rotatedCount++
          this.logger.info(`Rotated: ${file} (${this.formatBytes(stats.size)})`)
        }
      }

      const rotatedFiles = files.filter((file) => /\.log\.\d{4}-\d{2}-\d{2}/.test(file))

      for (const file of rotatedFiles) {
        const filePath = join(this.logsDir, file)
        const stats = await stat(filePath)
        const ageInDays = DateTime.now().diff(DateTime.fromJSDate(stats.mtime), 'days').days

        if (ageInDays > this.maxAgeDays) {
          await unlink(filePath)
          deletedCount++
          this.logger.info(`Deleted old log: ${file} (${ageInDays.toFixed(0)} days old)`)
        }
      }

      await this.cleanupExcessRotatedFiles(logFiles)

      this.logger.success(
        `Log rotation completed: ${rotatedCount} rotated, ${deletedCount} deleted`
      )
    } catch (error) {
      this.logger.error('Error during log rotation:', error)
      throw error
    }
  }

  /**
   * Rotate a log file by appending current date
   */
  private async rotateFile(filePath: string): Promise<void> {
    const date = DateTime.now().toFormat('yyyy-MM-dd-HHmmss')
    const newPath = `${filePath}.${date}`
    await rename(filePath, newPath)
  }

  /**
   * Keep only the most recent rotated files
   */
  private async cleanupExcessRotatedFiles(logFiles: string[]): Promise<void> {
    for (const logFile of logFiles) {
      const baseName = logFile.replace('.log', '')
      const pattern = new RegExp(`^${baseName}\\.log\\.\\d{4}-\\d{2}-\\d{2}`)

      const logsDir = await readdir(this.logsDir)

      const rotatedFiles = logsDir
        .filter((file) => pattern.test(file))
        .sort()
        .reverse()

      if (rotatedFiles.length > this.maxRotatedFiles) {
        const filesToDelete = rotatedFiles.slice(this.maxRotatedFiles)

        for (const file of filesToDelete) {
          const filePath = join(this.logsDir, file)
          await unlink(filePath)
          this.logger.info(`Deleted excess rotated file: ${file}`)
        }
      }
    }
  }

  /**
   * Format bytes to human-readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
}
