import { Button } from '~/components/elements/button'
import { Panel } from '../elements/panel'
import { InputGroup } from '~/components/forms/input_group'
import { useTranslation } from 'react-i18next'
import { PreferencesSectionProps } from '~/types/user_preference'

export function InterfacePreferences({ form, onSubmit }: PreferencesSectionProps) {
  const { t } = useTranslation('profile')

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <Panel
        title={t('preferences.interface.title')}
        subtitle={t('preferences.interface.subtitle')}
      >
        <div className="grid gap-6">
          <InputGroup
            label={t('preferences.interface.theme.label')}
            name="interface.theme"
            type="select"
            value={form.data.interface?.theme || 'light'}
            options={[
              { value: 'light', label: t('preferences.interface.theme.options.light') },
              { value: 'dark', label: t('preferences.interface.theme.options.dark') },
              { value: 'auto', label: t('preferences.interface.theme.options.auto') },
            ]}
            onChange={(e) => {
              form.setData('interface', {
                ...form.data.interface,
                theme: e.target.value as 'light' | 'dark' | 'auto',
              })
            }}
            helpText={t('preferences.interface.theme.help')}
          />
          <InputGroup
            label={t('preferences.interface.density.label')}
            name="interface.density"
            type="select"
            value={form.data.interface?.density || 'comfortable'}
            options={[
              { value: 'compact', label: t('preferences.interface.density.options.compact') },
              { value: 'comfortable', label: t('preferences.interface.density.options.comfortable') },
              { value: 'spacious', label: t('preferences.interface.density.options.spacious') },
            ]}
            onChange={(e) => {
              form.setData('interface', {
                ...form.data.interface,
                density: e.target.value as 'compact' | 'comfortable' | 'spacious',
              })
            }}
            helpText={t('preferences.interface.density.help')}
          />
        </div>
      </Panel>
      <Button loading={form.processing} fitContent>
        {t('preferences.save')}
      </Button>
    </form>
  )
}
