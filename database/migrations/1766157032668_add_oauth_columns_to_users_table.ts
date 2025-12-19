import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('github_id').nullable().unique()
      table.string('google_id').nullable().unique()
      table.string('facebook_id').nullable().unique()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('github_id')
      table.dropColumn('google_id')
      table.dropColumn('facebook_id')
    })
  }
}
