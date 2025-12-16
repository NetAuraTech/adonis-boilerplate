import { Database } from '@adonisjs/lucid/database'

export type DatabaseOptions = {
  caseInsensitive: boolean
}

type FieldContext = {}

export async function query(
  db: Database,
  table: string,
  column: string,
  value: string,
  options?: DatabaseOptions
) {
  return db
    .from(table)
    .select('id')
    .if(
      options?.caseInsensitive,
      (truthy) => truthy.whereILike(column, value),
      (falsy) => falsy.where(column, value)
    )
}

export function exists(table: string, column: string, options?: DatabaseOptions) {
  return async (db: Database, value: string, _field: FieldContext) => {
    const result = await query(db, table, column, value, options)

    return !!result.length
  }
}

export function unique(table: string, column: string, options?: DatabaseOptions) {
  return async (db: Database, value: string, _field: FieldContext) => {
    const result = await query(db, table, column, value, options)

    return !result.length
  }
}
