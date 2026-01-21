import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import BackupService from '#backup/services/backup_service'
import NotificationService from '#notification/services/notification_service'

/**
 * Command to clean up old backups based on retention policy
 *
 * Usage:
 *   node ace backup:cleanup
 */
export default class BackupCleanup extends BaseCommand {
  static commandName = 'backup:cleanup'
  static description = 'Clean up old backups based on retention policy (Spatie-like)'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
  }

  async run() {
    const notificationService = await this.app.container.make(NotificationService)
    const backupService = new BackupService(notificationService)

    this.logger.info('Starting backup cleanup...')

    try {
      const result = await backupService.cleanup()

      this.logger.success('Cleanup completed!')
      this.logger.info(`  Deleted: ${result.deleted} backup(s)`)
      this.logger.info(`  Kept: ${result.kept} backup(s)`)

      if (result.errors > 0) {
        this.logger.warning(`  Errors: ${result.errors}`)
        this.exitCode = 1
      }
    } catch (error) {
      this.logger.fatal('Unexpected error during cleanup')
      this.logger.fatal(error.message)
      if (error.stack) {
        this.logger.debug(error.stack)
      }
      this.exitCode = 1
    }
  }
}
