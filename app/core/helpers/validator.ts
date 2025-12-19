import { Database } from '@adonisjs/lucid/database'
import { FieldContext } from '@vinejs/vine/types'

export type DatabaseOptions = {
  caseInsensitive?: boolean
  exceptId?: number
}

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
    .if(options?.exceptId !== undefined, (q) => q.whereNot('id', options!.exceptId!))
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

    if (result.length) {
      _field.report(`The {{ field }} has already been taken`, 'unique', _field)
    }

    return !result.length
  }
}
