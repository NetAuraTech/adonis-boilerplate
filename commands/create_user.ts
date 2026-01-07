import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#auth/models/user'

export default class CreateUser extends BaseCommand {
  static commandName = 'create:user'
  static description = 'Create a new user'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string()
  declare email: string

  async run() {
    this.logger.info(`Creating user ${this.email} with password "password"`)
    await User.create({ email: this.email.toLowerCase().trim(), password: 'password', roleId: 1 })
    this.logger.success('User created successfully')
  }
}
