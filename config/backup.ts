import env from '#start/env'

/**
 * Configuration for the backup system
 *
 * Supports multiple storage providers:
 * - Local: Always enabled (primary storage)
 * - S3: Enabled if credentials provided
 * - Nextcloud: Enabled if credentials provided
 *
 * Backup strategy:
 * - Full backup: Weekly (Sunday)
 * - Differential backup: Daily (Monday-Saturday)
 *
 * Rotation policy (Spatie-like):
 * - Daily: Keep 7 last days
 * - Weekly: Keep 4 last weeks (Sunday)
 * - Monthly: Keep 3 last months (1st of month)
 * - Yearly: Keep 1 per year (1st January) - optional
 */
const backupConfig = {
  /**
   * Database connection to backup
   */
  database: {
    connection: env.get('DB_CONNECTION', 'postgres'),
  },

  /**
   * Backup schedule configuration
   */
  schedule: {
    /**
     * Full backup day (0 = Sunday, 6 = Saturday)
     */
    fullBackupDay: 0, // Sunday

    /**
     * Backup time (24h format)
     */
    time: env.get('BACKUP_TIME', '02:00'),
  },

  /**
   * Encryption configuration
   */
  encryption: {
    /**
     * Enable encryption
     */
    enabled: env.get('BACKUP_ENCRYPTION_ENABLED', true),

    /**
     * Encryption key (uses APP_KEY by default)
     */
    key: env.get('APP_KEY'),

    /**
     * Encryption algorithm
     */
    algorithm: 'aes-256-cbc',
  },

  /**
   * Compression configuration
   */
  compression: {
    /**
     * Enable gzip compression
     */
    enabled: true,

    /**
     * Compression level (1-9, 9 = max compression)
     */
    level: 6,
  },

  /**
   * Storage providers configuration
   */
  storages: {
    /**
     * Local storage (always enabled)
     */
    local: {
      enabled: true,
      path: env.get('BACKUP_LOCAL_PATH', 'storage/backups'),
    },

    /**
     * S3 storage (enabled if credentials provided)
     */
    s3: {
      enabled: env.get('BACKUP_S3_ENABLED', false),
      bucket: env.get('BACKUP_S3_BUCKET', ''),
      region: env.get('BACKUP_S3_REGION', 'us-east-1'),
      endpoint: env.get('BACKUP_S3_ENDPOINT', ''), // For S3-compatible services
      accessKeyId: env.get('BACKUP_S3_ACCESS_KEY_ID', ''),
      secretAccessKey: env.get('BACKUP_S3_SECRET_ACCESS_KEY', ''),
      path: env.get('BACKUP_S3_PATH', 'backups'),
    },

    /**
     * Nextcloud storage (WebDAV)
     */
    nextcloud: {
      enabled: env.get('BACKUP_NEXTCLOUD_ENABLED', false),
      url: env.get('BACKUP_NEXTCLOUD_URL', ''),
      username: env.get('BACKUP_NEXTCLOUD_USERNAME', ''),
      password: env.get('BACKUP_NEXTCLOUD_PASSWORD', ''), // App password recommended
      path: env.get('BACKUP_NEXTCLOUD_PATH', '/backups'),
    },
  },

  /**
   * Rotation policy (Spatie-like)
   */
  retention: {
    /**
     * Keep backups for X days
     */
    daily: env.get('BACKUP_RETENTION_DAILY', 7),

    /**
     * Keep weekly backups for X weeks (Sunday backups)
     */
    weekly: env.get('BACKUP_RETENTION_WEEKLY', 4),

    /**
     * Keep monthly backups for X months (1st of month)
     */
    monthly: env.get('BACKUP_RETENTION_MONTHLY', 3),

    /**
     * Keep yearly backups for X years (1st January)
     */
    yearly: env.get('BACKUP_RETENTION_YEARLY', 1),
  },

  /**
   * Health check configuration
   */
  health: {
    /**
     * Maximum age of last backup (in hours)
     * Alert if no backup in X hours
     */
    maxBackupAge: env.get('BACKUP_MAX_AGE_HOURS', 25), // 25h = 1 day + margin

    /**
     * Maximum backup size to alert (in MB)
     */
    maxBackupSize: env.get('BACKUP_MAX_SIZE_MB', 500),

    /**
     * Minimum free disk space (in GB)
     */
    minFreeSpace: env.get('BACKUP_MIN_FREE_SPACE_GB', 5),
  },

  /**
   * Notification configuration
   */
  notifications: {
    /**
     * Email to send alerts
     */
    email: env.get('BACKUP_NOTIFICATION_EMAIL', env.get('SMTP_FROM_ADDRESS')),

    /**
     * Send notification on success
     */
    onSuccess: env.get('BACKUP_NOTIFY_SUCCESS', false),

    /**
     * Send notification on failure
     */
    onFailure: env.get('BACKUP_NOTIFY_FAILURE', true),

    /**
     * Send notification on health check failure
     */
    onHealthCheckFailure: env.get('BACKUP_NOTIFY_HEALTH_CHECK', true),
  },

  /**
   * Differential backup configuration
   */
  differential: {
    /**
     * Enable differential backups
     */
    enabled: true,

    /**
     * Tables to exclude from differential backups
     * (always backed up in full backups)
     */
    excludedTables: env.get('BACKUP_EXCLUDED_TABLES', '').split(',').filter(Boolean),
  },
}

export default backupConfig
