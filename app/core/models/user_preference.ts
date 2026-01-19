import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#auth/models/user'

/**
 * Notification preferences structure
 */
export interface NotificationPreferences {
  email: Record<string, boolean>
  inApp: Record<string, boolean>
  emailFrequency: 'immediate' | 'daily_digest' | 'weekly_digest'
}

/**
 * Interface preferences structure
 */
export interface InterfacePreferences {
  theme: 'light' | 'dark' | 'auto'
  density: 'compact' | 'comfortable' | 'spacious'
}

/**
 * Privacy preferences structure
 */
export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private'
  showEmail: boolean
  showActivity: boolean
}

/**
 * Main user preferences data structure
 * Extensible for future preference categories
 */
export interface UserPreferencesData {
  notifications?: NotificationPreferences
  interface?: InterfacePreferences
  privacy?: PrivacyPreferences
  [key: string]: any
}

export default class UserPreference extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare preferences: UserPreferencesData

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /**
   * Get notification preferences with defaults
   */
  get notifications(): NotificationPreferences {
    return this.preferences.notifications || this.getDefaultNotificationPreferences()
  }

  /**
   * Get interface preferences with defaults
   */
  get interface(): InterfacePreferences {
    return this.preferences.interface || this.getDefaultInterfacePreferences()
  }

  /**
   * Get privacy preferences with defaults
   */
  get privacy(): PrivacyPreferences {
    return this.preferences.privacy || this.getDefaultPrivacyPreferences()
  }

  /**
   * Get a specific preference by path
   * Example: get('notifications.email.email_verified')
   *
   * @param path - Dot-separated path to the preference
   * @param defaultValue - Default value if preference doesn't exist
   * @returns The preference value or default
   */
  get(path: string, defaultValue?: any): any {
    const keys = path.split('.')
    let value: any = this.preferences

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return defaultValue
      }
    }

    return value
  }

  /**
   * Set a specific preference by path
   * Example: set('notifications.email.email_verified', false)
   *
   * @param path - Dot-separated path to the preference
   * @param value - Value to set
   */
  set(path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    let target: any = this.preferences

    for (const key of keys) {
      if (!(key in target)) {
        target[key] = {}
      }
      target = target[key]
    }

    target[lastKey] = value
  }

  /**
   * Get default notification preferences
   */
  private getDefaultNotificationPreferences(): NotificationPreferences {
    return {
      email: {
        email_verified: true,
        email_change_requested: true,
        email_changed: true,
        password_reset_requested: true,
        password_changed: true,
        user_invited: true,
        account_deleted: true,
      },
      inApp: {
        email_verified: true,
        email_change_requested: true,
        email_changed: true,
        password_reset_requested: true,
        password_changed: true,
        user_invited: true,
        account_deleted: true,
      },
      emailFrequency: 'immediate',
    }
  }

  /**
   * Get default interface preferences
   */
  private getDefaultInterfacePreferences(): InterfacePreferences {
    return {
      theme: 'light',
      density: 'comfortable',
    }
  }

  /**
   * Get default privacy preferences
   */
  private getDefaultPrivacyPreferences(): PrivacyPreferences {
    return {
      profileVisibility: 'public',
      showEmail: false,
      showActivity: true,
    }
  }
}
