import UserPreference, { type UserPreferencesData } from '#core/models/user_preference'
import logger from '@adonisjs/core/services/logger'

export default class UserPreferenceService {
  /**
   * Get or create user preferences
   * Creates default preferences if none exist
   *
   * @param userId - User ID
   * @returns User preferences
   */
  async getOrCreate(userId: number): Promise<UserPreference> {
    let preferences = await UserPreference.query().where('user_id', userId).first()

    if (!preferences) {
      preferences = await UserPreference.create({
        userId,
        preferences: this.getDefaultPreferences(),
      })

      logger.info('User preferences created with defaults', { userId })
    }

    return preferences
  }

  /**
   * Update user preferences (deep merge with existing)
   * Preserves existing preferences not specified in updates
   *
   * @param userId - User ID
   * @param updates - Partial preference updates
   * @returns Updated user preferences
   */
  async update(userId: number, updates: Partial<UserPreferencesData>): Promise<UserPreference> {
    const preferences = await this.getOrCreate(userId)

    preferences.preferences = this.deepMerge(preferences.preferences, updates)
    await preferences.save()

    logger.info('User preferences updated', {
      userId,
      updatedKeys: Object.keys(updates),
    })

    return preferences
  }

  /**
   * Set a specific preference by path
   * Example: set(userId, 'notifications.email.email_verified', false)
   *
   * @param userId - User ID
   * @param path - Dot-separated path to preference
   * @param value - Value to set
   * @returns Updated user preferences
   */
  async set(userId: number, path: string, value: any): Promise<UserPreference> {
    const preferences = await this.getOrCreate(userId)
    preferences.set(path, value)
    await preferences.save()

    logger.info('User preference set', { userId, path, value })

    return preferences
  }

  /**
   * Get a specific preference by path
   * Example: get(userId, 'notifications.email.email_verified', true)
   *
   * @param userId - User ID
   * @param path - Dot-separated path to preference
   * @param defaultValue - Default value if preference doesn't exist
   * @returns Preference value or default
   */
  async get(userId: number, path: string, defaultValue?: any): Promise<any> {
    const preferences = await UserPreference.query().where('user_id', userId).first()

    if (!preferences) {
      return defaultValue
    }

    return preferences.get(path, defaultValue)
  }

  /**
   * Reset all preferences to defaults
   *
   * @param userId - User ID
   * @returns Reset user preferences
   */
  async reset(userId: number): Promise<UserPreference> {
    const preferences = await this.getOrCreate(userId)
    preferences.preferences = this.getDefaultPreferences()
    await preferences.save()

    logger.info('User preferences reset to defaults', { userId })

    return preferences
  }

  /**
   * Reset a specific preference category to defaults
   * Example: resetCategory(userId, 'notifications')
   *
   * @param userId - User ID
   * @param category - Category to reset (notifications, interface, privacy)
   * @returns Updated user preferences
   */
  async resetCategory(
    userId: number,
    category: keyof UserPreferencesData
  ): Promise<UserPreference> {
    const preferences = await this.getOrCreate(userId)
    const defaults = this.getDefaultPreferences()

    if (category in defaults) {
      preferences.preferences[category] = defaults[category]
      await preferences.save()

      logger.info('User preference category reset', { userId, category })
    }

    return preferences
  }

  /**
   * Get default preferences structure
   * Used when creating new user preferences
   *
   * @returns Default preferences object
   */
  private getDefaultPreferences(): UserPreferencesData {
    return {
      notifications: {
        email: {
          security: true,
          account: true,
          social: true,
        },
        inApp: {
          security: true,
          account: true,
          social: true,
        },
        emailFrequency: 'immediate',
      },
      interface: {
        theme: 'light',
        density: 'comfortable',
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showActivity: true,
      },
    }
  }

  /**
   * Deep merge utility for nested objects
   * Recursively merges source into target
   *
   * @param target - Target object
   * @param source - Source object to merge
   * @returns Merged object
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target }

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key]
          } else {
            output[key] = this.deepMerge(target[key], source[key])
          }
        } else {
          output[key] = source[key]
        }
      })
    }

    return output
  }

  /**
   * Check if value is a plain object
   *
   * @param item - Value to check
   * @returns True if plain object
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item)
  }
}
