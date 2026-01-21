import { BaseCommand, flags } from '@adonisjs/core/ace' // Import des flags
import { inject } from '@adonisjs/core'
import BackupService from '#backup/services/backup_service'

@inject()
export default class BackupList extends BaseCommand {
  static commandName = 'backup:list'
  static description = 'List all available backups'

  static options = {
    startApp: true,
  }

  // Définition du flag --limit
  @flags.number({
    description: 'Limit the number of backups displayed',
    alias: 'l',
  })
  declare limit: number

  async run() {
    const backupService = await this.app.container.make(BackupService)

    try {
      const localStorage = backupService['storages'].find((s: any) => s.name === 'local')

      if (!localStorage) {
        this.logger.error('Local storage not available')
        this.exitCode = 1
        return
      }

      let backups = await localStorage.list()

      if (backups.length === 0) {
        this.logger.info('No backups found')
        return
      }

      // 1. Trier les backups par date (du plus récent au plus ancien)
      backups = backups.sort((a: any, b: any) => {
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

      // 2. Appliquer la limite si elle est renseignée
      if (this.limit) {
        backups = backups.slice(0, this.limit)
      }

      const table = this.ui.table()
      table.head(['Filename', 'Type', 'Size', 'Created At'])

      for (const backup of backups) {
        const sizeInMB = (backup.size / (1024 * 1024)).toFixed(2)
        table.row([
          backup.filename,
          backup.type,
          `${sizeInMB} MB`,
          backup.createdAt.toLocaleString(),
        ])
      }

      table.render()
    } catch (error) {
      this.logger.error(`Failed to list backups: ${error.message}`)
      this.exitCode = 1
    }
  }
}
