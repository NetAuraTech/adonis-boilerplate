/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string.optional(),
  HOST: Env.schema.string({ format: 'host' }),
  DOMAIN: Env.schema.string(),
  LOG_LEVEL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.string(),
  SMTP_USERNAME: Env.schema.string(),
  SMTP_PASSWORD: Env.schema.string(),
  SMTP_FROM_ADDRESS: Env.schema.string(),

  /*
  |--------------------------------------------------------------------------
  | OAuth GitHub (optional)
  |--------------------------------------------------------------------------
  */
  GITHUB_CLIENT_ID: Env.schema.string.optional(),
  GITHUB_CLIENT_SECRET: Env.schema.string.optional(),
  GITHUB_CALLBACK_URL: Env.schema.string.optional(),

  /*
  |--------------------------------------------------------------------------
  | OAuth Google (optional)
  |--------------------------------------------------------------------------
  */
  GOOGLE_CLIENT_ID: Env.schema.string.optional(),
  GOOGLE_CLIENT_SECRET: Env.schema.string.optional(),
  GOOGLE_CALLBACK_URL: Env.schema.string.optional(),

  /*
  |--------------------------------------------------------------------------
  | OAuth Facebook (optional)
  |--------------------------------------------------------------------------
  */
  FACEBOOK_CLIENT_ID: Env.schema.string.optional(),
  FACEBOOK_CLIENT_SECRET: Env.schema.string.optional(),
  FACEBOOK_CALLBACK_URL: Env.schema.string.optional(),

  /*
  |--------------------------------------------------------------------------
  | Redis
  |--------------------------------------------------------------------------
  */
  REDIS_ENABLED: Env.schema.boolean(),
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),
  REDIS_SOCKET: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring @rlanz/sentry package
  |----------------------------------------------------------
  */
  SENTRY_DSN: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for Backup Configuration
  |----------------------------------------------------------
  */
  BACKUP_TIME: Env.schema.string.optional(),
  BACKUP_ENCRYPTION_ENABLED: Env.schema.boolean.optional(),
  BACKUP_LOCAL_PATH: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Backup Configuration: S3 Storage
  |----------------------------------------------------------
  */
  BACKUP_S3_ENABLED: Env.schema.boolean.optional(),
  BACKUP_S3_BUCKET: Env.schema.string.optional(),
  BACKUP_S3_REGION: Env.schema.string.optional(),
  BACKUP_S3_ENDPOINT: Env.schema.string.optional(),
  BACKUP_S3_ACCESS_KEY_ID: Env.schema.string.optional(),
  BACKUP_S3_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  BACKUP_S3_PATH: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Backup Configuration: Nextcloud Storage
  |----------------------------------------------------------
  */
  BACKUP_NEXTCLOUD_ENABLED: Env.schema.boolean.optional(),
  BACKUP_NEXTCLOUD_URL: Env.schema.string.optional(),
  BACKUP_NEXTCLOUD_USERNAME: Env.schema.string.optional(),
  BACKUP_NEXTCLOUD_PASSWORD: Env.schema.string.optional(),
  BACKUP_NEXTCLOUD_PATH: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Backup Configuration: Retention
  |----------------------------------------------------------
  */
  BACKUP_RETENTION_DAILY: Env.schema.number.optional(),
  BACKUP_RETENTION_WEEKLY: Env.schema.number.optional(),
  BACKUP_RETENTION_MONTHLY: Env.schema.number.optional(),
  BACKUP_RETENTION_YEARLY: Env.schema.number.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Backup Configuration: Health Check
  |----------------------------------------------------------
  */
  BACKUP_MAX_AGE_HOURS: Env.schema.number.optional(),
  BACKUP_MAX_SIZE_MB: Env.schema.number.optional(),
  BACKUP_MIN_FREE_SPACE_GB: Env.schema.number.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Backup Configuration: Notifications
  |----------------------------------------------------------
  */
  BACKUP_NOTIFICATION_EMAIL: Env.schema.string.optional(),
  BACKUP_NOTIFY_SUCCESS: Env.schema.boolean.optional(),
  BACKUP_NOTIFY_FAILURE: Env.schema.boolean.optional(),
  BACKUP_NOTIFY_HEALTH_CHECK: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Backup Configuration: Differential
  |----------------------------------------------------------
  */
  BACKUP_EXCLUDED_TABLES: Env.schema.string.optional(),
})
