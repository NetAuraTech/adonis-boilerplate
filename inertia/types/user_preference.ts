export interface UserPreference {
  id: number
  user_id: number
  preferences: {
    notifications?: {
      email: Record<string, boolean>
      inApp: Record<string, boolean>
      emailFrequency: 'immediate' | 'daily_digest' | 'weekly_digest'
    }
    interface?: {
      theme: 'light' | 'dark' | 'auto'
      language: 'en' | 'fr'
      density: 'compact' | 'comfortable' | 'spacious'
    }
    privacy?: {
      profileVisibility: 'public' | 'private'
      showEmail: boolean
      showActivity: boolean
    }
  }
}
