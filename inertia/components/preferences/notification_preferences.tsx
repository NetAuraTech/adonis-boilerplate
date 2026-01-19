import { Panel } from '~/components/elements/panel'
import { InputGroup } from '~/components/forms/input_group'
import { Button } from '~/components/elements/button'
import { useTranslation } from 'react-i18next'
import { PreferencesSectionProps } from '~/types/user_preference'

export function NotificationPreferences({ form, onSubmit }: PreferencesSectionProps) {
  const { t } = useTranslation('profile')

  const notificationCategories = [
    {
      key: 'security',
      label: t('preferences.notifications.categories.security.label'),
      description: t('preferences.notifications.categories.security.description'),
    },
    {
      key: 'account',
      label: t('preferences.notifications.categories.account.label'),
      description: t('preferences.notifications.categories.account.description'),
    },
    {
      key: 'social',
      label: t('preferences.notifications.categories.social.label'),
      description: t('preferences.notifications.categories.social.description'),
    },
  ]

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <Panel
        title={t('preferences.notifications.email.title')}
        subtitle={t('preferences.notifications.email.subtitle')}
      >
        <div className="grid gap-4">
          {notificationCategories.map((category) => (
            <InputGroup
              key={`email-${category.key}`}
              label={category.label}
              name={`notifications.email.${category.key}`}
              type="checkbox"
              checked={form.data.notifications?.email?.[category.key as keyof typeof form.data.notifications.email] ?? true}
              onChange={(e) => {
                form.setData('notifications', {
                  ...form.data.notifications,
                  email: {
                    ...form.data.notifications?.email,
                    [category.key]: (e.target as HTMLInputElement).checked,
                  },
                })
              }}
            />
          ))}
        </div>
      </Panel>
      <Panel
        title={t('preferences.notifications.inApp.title')}
        subtitle={t('preferences.notifications.inApp.subtitle')}
      >
        <div className="grid gap-4">
          {notificationCategories.map((category) => (
            <InputGroup
              key={`inApp-${category.key}`}
              label={category.label}
              name={`notifications.inApp.${category.key}`}
              type="checkbox"
              checked={form.data.notifications?.inApp?.[category.key as keyof typeof form.data.notifications.inApp] ?? true}
              onChange={(e) => {
                form.setData('notifications', {
                  ...form.data.notifications,
                  inApp: {
                    ...form.data.notifications?.inApp,
                    [category.key]: (e.target as HTMLInputElement).checked,
                  },
                })
              }}
            />
          ))}
        </div>
      </Panel>
      <Panel
        title={t('preferences.notifications.frequency.title')}
        subtitle={t('preferences.notifications.frequency.subtitle')}
      >
        <InputGroup
          label={t('preferences.notifications.frequency.title')}
          name="notifications.emailFrequency"
          type="select"
          value={form.data.notifications?.emailFrequency || 'immediate'}
          options={[
            { value: 'immediate', label: t('preferences.notifications.frequency.options.immediate') },
            { value: 'daily_digest', label: t('preferences.notifications.frequency.options.daily_digest') },
            { value: 'weekly_digest', label: t('preferences.notifications.frequency.options.weekly_digest') },
          ]}
          onChange={(e) => {
            form.setData('notifications', {
              ...form.data.notifications,
              emailFrequency: e.target.value as 'immediate' | 'daily_digest' | 'weekly_digest',
            })
          }}
        />
      </Panel>
      <Button loading={form.processing} fitContent>
        {t('preferences.save')}
      </Button>
    </form>
  )
}
