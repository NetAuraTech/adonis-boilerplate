import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import BackupService from '#backup/services/backup_service'
import NotificationService from '#notification/services/notification_service'

/**
 * Command to run database backup
 *
 * Usage:
 *   node ace backup:run
 *   node ace backup:run --type=full
 *   node ace backup:run --type=differential
 */
export default class BackupRun extends BaseCommand {
  static commandName = 'backup:run'
  static description = 'Run database backup (auto-detects type based on schedule or specify --type)'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
  }

  @flags.string({
    description: 'Backup type (full or differential). Auto-detected if not specified.',
  })
  declare type?: 'full' | 'differential'

  async run() {
    const notificationService = await this.app.container.make(NotificationService)
    const backupService = new BackupService(notificationService)

    this.logger.info('Starting database backup...')

    try {
      let result

      if (this.type === 'full') {
        this.logger.info('Running FULL backup (forced)')
        result = await backupService.runFullBackup()
      } else if (this.type === 'differential') {
        this.logger.info('Running DIFFERENTIAL backup (forced)')
        result = await backupService.runDifferentialBackup()
      } else {
        this.logger.info('Auto-detecting backup type based on schedule...')
        result = await backupService.run()
      }

      if (result.success) {
        this.logger.success('Backup completed successfully!')
        this.logger.info(`  Filename: ${result.filename}`)
        this.logger.info(`  Type: ${result.type}`)
        this.logger.info(`  Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`)
        this.logger.info(`  Duration: ${(result.duration / 1000).toFixed(2)}s`)
        this.logger.info(`  Storages:`)

        for (const [storage, success] of Object.entries(result.storages)) {
          if (success) {
            this.logger.info(`    ✓ ${storage}`)
          } else {
            this.logger.warning(`    ✗ ${storage} (failed)`)
          }
        }
      } else {
        this.logger.error('Backup failed!')
        this.logger.error(`  Error: ${result.error}`)
        this.exitCode = 1
      }
    } catch (error) {
      this.logger.fatal('Unexpected error during backup')
      this.logger.fatal(error.message)
      if (error.stack) {
        this.logger.debug(error.stack)
      }
      this.exitCode = 1
    }
  }
}
