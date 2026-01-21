import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import BackupService from '#backup/services/backup_service'
import NotificationService from '#notification/services/notification_service'
import { DateTime } from 'luxon'

/**
 * Command to check backup system health
 *
 * Usage:
 *   node ace backup:health-check
 */
export default class BackupHealthCheck extends BaseCommand {
  static commandName = 'backup:health-check'
  static description = 'Check backup system health and alert if issues found'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
  }

  async run() {
    const notificationService = await this.app.container.make(NotificationService)
    const backupService = new BackupService(notificationService)

    this.logger.info('Running backup health check...')

    try {
      const result = await backupService.healthCheck()

      if (result.healthy) {
        this.logger.success('✓ Backup system is healthy!')
      } else {
        this.logger.error('✗ Backup system has issues:')
        for (const issue of result.issues) {
          this.logger.error(`  - ${issue}`)
        }
        this.exitCode = 1
      }

      this.logger.info('')
      this.logger.info('Storage Status:')
      for (const [storage, available] of Object.entries(result.storages)) {
        if (available) {
          this.logger.info(`  ✓ ${storage}`)
        } else {
          this.logger.error(`  ✗ ${storage} (unavailable)`)
        }
      }

      if (result.lastBackup) {
        this.logger.info('')
        this.logger.info('Last Backup:')
        this.logger.info(`  Filename: ${result.lastBackup.filename}`)
        this.logger.info(`  Type: ${result.lastBackup.type}`)
        this.logger.info(`  Size: ${(result.lastBackup.size / 1024 / 1024).toFixed(2)} MB`)
        this.logger.info(
          `  Created: ${DateTime.fromJSDate(result.lastBackup.createdAt).toLocaleString(DateTime.DATETIME_MED)}`
        )

        const hoursAgo = (Date.now() - result.lastBackup.createdAt.getTime()) / (1000 * 60 * 60)
        this.logger.info(`  Age: ${hoursAgo.toFixed(1)} hours ago`)
      } else {
        this.logger.warning('')
        this.logger.warning('No backups found!')
      }
    } catch (error) {
      this.logger.fatal('Unexpected error during health check')
      this.logger.fatal(error.message)
      if (error.stack) {
        this.logger.debug(error.stack)
      }
      this.exitCode = 1
    }
  }
}
