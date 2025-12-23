import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rate_limits'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('key', 255).notNullable().unique()
      table.integer('hits').notNullable().defaultTo(0)
      table.timestamp('reset_at').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index('reset_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
