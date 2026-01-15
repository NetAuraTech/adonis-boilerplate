import vine from '@vinejs/vine'

/**
 * Validators for user preference endpoints
 * Supports flexible JSON structure while validating known categories
 */
export default class UserPreferenceValidators {
  /**
   * Validator for updating user preferences
   * Supports partial updates with deep merge
   *
   * Known categories: notifications, interface, privacy
   * Additional categories are allowed for extensibility
   */
  static update = () => {
    return vine.compile(
      vine
        .object({
          notifications: vine
            .object({
              email: vine.record(vine.any()).optional(),
              inApp: vine.record(vine.any()).optional(),
              emailFrequency: vine.enum(['immediate', 'daily_digest', 'weekly_digest']).optional(),
            })
            .optional(),

          interface: vine
            .object({
              theme: vine.enum(['light', 'dark', 'auto']).optional(),
              language: vine.enum(['en', 'fr']).optional(),
              density: vine.enum(['compact', 'comfortable', 'spacious']).optional(),
            })
            .optional(),

          privacy: vine
            .object({
              profileVisibility: vine.enum(['public', 'private']).optional(),
              showEmail: vine.boolean().optional(),
              showActivity: vine.boolean().optional(),
            })
            .optional(),
        })
        .allowUnknownProperties()
    )
  }

  /**
   * Validator for setting a specific preference by path
   * Allows any path and value for maximum flexibility
   *
   * Example: { path: 'notifications.email.email_verified', value: false }
   */
  static setPreference = () => {
    return vine.compile(
      vine.object({
        path: vine.string().trim().minLength(1).maxLength(255),
        value: vine.any(),
      })
    )
  }

  /**
   * Validator for getting a specific preference by path
   * Path is passed as URL parameter
   */
  static getPreference = () => {
    return vine.compile(
      vine.object({
        path: vine.string().trim().minLength(1).maxLength(255),
      })
    )
  }

  /**
   * Validator for resetting a preference category
   * Category must be one of the known types
   */
  static resetCategory = () => {
    return vine.compile(
      vine.object({
        category: vine.enum(['notifications', 'interface', 'privacy']),
      })
    )
  }
}
