import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 50).notNullable().unique()
      table.string('slug', 50).notNullable().unique()
      table.text('description').nullable()
      table.boolean('is_system').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('is_system')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
