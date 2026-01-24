import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import BackupService from '#backup/services/backup_service'
import NotificationService from '#notification/services/notification_service'
import LogService from '#core/services/log_service'

/**
 * Command to restore a backup
 *
 * Usage:
 *   node ace backup:restore backup-full-2025-01-20-143052.sql.gz.enc
 *   node ace backup:restore backup-full-2025-01-20-143052.sql.gz.enc --force
 */
export default class BackupRestore extends BaseCommand {
  static commandName = 'backup:restore'
  static description = 'Restore database from a backup file'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
  }

  @args.string({
    description: 'Backup filename to restore',
  })
  declare filename: string

  @flags.boolean({
    description: 'Skip confirmation prompt',
  })
  declare force: boolean

  async run() {
    const notificationService = await this.app.container.make(NotificationService)
    const logService = new LogService()
    const backupService = new BackupService(notificationService, logService)

    if (!this.force) {
      this.logger.warning('⚠️  WARNING: This will REPLACE all current database data!')
      this.logger.warning(`⚠️  Backup file: ${this.filename}`)
      this.logger.warning('')

      const confirmed = await this.prompt.confirm('Are you sure you want to restore this backup?', {
        default: false,
      })

      if (!confirmed) {
        this.logger.info('Restoration cancelled.')
        return
      }
    }

    this.logger.info('Starting database restoration...')
    this.logger.info(`  File: ${this.filename}`)

    try {
      const result = await backupService.restore(this.filename)

      if (result.success) {
        this.logger.success('✓ Database restored successfully!')
        this.logger.warning('⚠️  Please restart your application.')
      } else {
        this.logger.error('✗ Restoration failed!')
        this.logger.error(`  Error: ${result.error}`)
        this.exitCode = 1
      }
    } catch (error) {
      this.logger.fatal('Unexpected error during restoration')
      this.logger.fatal(error.message)
      if (error.stack) {
        this.logger.debug(error.stack)
      }
      this.exitCode = 1
    }
  }
}
