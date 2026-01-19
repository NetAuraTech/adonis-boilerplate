import { Button } from '~/components/elements/button'
import { Panel } from '../elements/panel'
import { InputGroup } from '~/components/forms/input_group'
import { useTranslation } from 'react-i18next'
import { PreferencesSectionProps } from '~/types/user_preference'

export function PrivacyPreferences({ form, onSubmit }: PreferencesSectionProps) {
  const { t } = useTranslation('profile')

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <Panel
        title={t('preferences.privacy.title')}
        subtitle={t('preferences.privacy.subtitle')}
      >
        <div className="grid gap-6">
          <InputGroup
            label={t('preferences.privacy.profile_visibility.label')}
            name="privacy.profileVisibility"
            type="select"
            value={form.data.privacy?.profileVisibility || 'public'}
            options={[
              { value: 'public', label: t('preferences.privacy.profile_visibility.options.public') },
              { value: 'private', label: t('preferences.privacy.profile_visibility.options.private') },
            ]}
            onChange={(e) => {
              form.setData('privacy', {
                ...form.data.privacy,
                profileVisibility: e.target.value as 'public' | 'private',
              })
            }}
            helpText={t('preferences.privacy.profile_visibility.help')}
          />
          <InputGroup
            label={t('preferences.privacy.show_email.label')}
            name="privacy.showEmail"
            type="checkbox"
            checked={form.data.privacy?.showEmail ?? false}
            onChange={(e) => {
              form.setData('privacy', {
                ...form.data.privacy,
                showEmail: (e.target as HTMLInputElement).checked,
              })
            }}
            helpText={t('preferences.privacy.show_email.help')}
          />
          <InputGroup
            label={t('preferences.privacy.show_activity.label')}
            name="privacy.showActivity"
            type="checkbox"
            checked={form.data.privacy?.showActivity ?? true}
            onChange={(e) => {
              form.setData('privacy', {
                ...form.data.privacy,
                showActivity: (e.target as HTMLInputElement).checked,
              })
            }}
            helpText={t('preferences.privacy.show_activity.help')}
          />
        </div>
      </Panel>
      <Button loading={form.processing} fitContent>
        {t('preferences.save')}
      </Button>
    </form>
  )
}
