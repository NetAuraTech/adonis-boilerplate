import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tokens'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('selector', 64).nullable().index()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('selector')
    })
  }
}
