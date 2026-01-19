import vine from '@vinejs/vine'

/**
 * Validators for user preference endpoints
 * Updated to use categories instead of individual notification types
 */
export default class UserPreferenceValidators {
  /**
   * Validator for updating user preferences
   * Supports partial updates with deep merge
   */
  static update = () => {
    return vine.compile(
      vine
        .object({
          notifications: vine
            .object({
              email: vine
                .object({
                  security: vine.boolean().optional(),
                  account: vine.boolean().optional(),
                  social: vine.boolean().optional(),
                })
                .optional(),
              inApp: vine
                .object({
                  security: vine.boolean().optional(),
                  account: vine.boolean().optional(),
                  social: vine.boolean().optional(),
                })
                .optional(),
              emailFrequency: vine.enum(['immediate', 'daily_digest', 'weekly_digest']).optional(),
            })
            .optional(),

          interface: vine
            .object({
              theme: vine.enum(['light', 'dark', 'auto']).optional(),
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
   */
  static resetCategory = () => {
    return vine.compile(
      vine.object({
        category: vine.enum(['notifications', 'interface', 'privacy']),
      })
    )
  }
}
