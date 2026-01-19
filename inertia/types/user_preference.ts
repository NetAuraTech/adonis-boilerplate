import { InertiaFormProps } from '@inertiajs/react'
import { FormEvent } from 'react'

export interface NotificationCategoryPreferences {
  security: boolean
  account: boolean
  social: boolean
}

export interface NotificationPreferences {
  email: NotificationCategoryPreferences
  inApp: NotificationCategoryPreferences
  emailFrequency: 'immediate' | 'daily_digest' | 'weekly_digest'
}

export interface InterfacePreferences {
  theme: 'light' | 'dark' | 'auto'
  density: 'compact' | 'comfortable' | 'spacious'
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private'
  showEmail: boolean
  showActivity: boolean
}

export interface UserPreferencesData {
  notifications: NotificationPreferences
  interface: InterfacePreferences
  privacy: PrivacyPreferences
}

export interface UserPreference {
  id: number
  userId: number
  preferences: UserPreferencesData
  createdAt: string
  updatedAt: string
}

export interface PreferencesSectionProps {
  form: InertiaFormProps<UserPreferencesData>
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}
