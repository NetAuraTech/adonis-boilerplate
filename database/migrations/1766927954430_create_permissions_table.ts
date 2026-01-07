import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 100).notNullable().unique()
      table.string('slug', 100).notNullable().unique()
      table.string('category', 50).notNullable() // e.g., 'users', 'roles', 'content'
      table.text('description').nullable()
      table.boolean('is_system').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('category')
      table.index('is_system')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
