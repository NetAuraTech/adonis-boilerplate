import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('type', 100).notNullable()
      table.string('title', 255).notNullable()
      table.text('message').notNullable()
      table.json('data').nullable()
      table.timestamp('read_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.index(['user_id', 'read_at'], 'notifications_user_read_index')
      table.index(['user_id', 'created_at'], 'notifications_user_created_index')
      table.index(['type'], 'notifications_type_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
