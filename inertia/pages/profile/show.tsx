import { FormEvent, useState } from 'react'
import { Panel } from '#components/elements/panel'
import { InputGroup } from '#components/forms/input_group'
import { Button } from '#components/elements/button'
import { Head, router, useForm, usePage } from '@inertiajs/react'
import type { OAuthProvider } from '~/types/oauth'
import type { SharedProps } from '@adonisjs/inertia/types'
import { getProviderRoute } from '~/helpers/oauth'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets, rules } from '~/helpers/validation_rules'
import { Heading } from '~/components/elements/heading'
import { Banner } from '~/components/elements/banner'
import { UserPreference } from '~/types/user_preference'
import { Notification } from '~/types/notification'
import { Tabs } from '~/components/elements/tabs'
import { NotificationPreferences } from '~/components/preferences/notification_preferences'
import { InterfacePreferences } from '~/components/preferences/interface_preferences'
import { PrivacyPreferences } from '~/components/preferences/privacy_preferences'

interface LinkedProviders {
  github: boolean
  google: boolean
  facebook: boolean
}

interface ProfilePageProps {
  notifications: Notification[]
  providers: OAuthProvider[]
  linkedProviders: LinkedProviders
  preferences: UserPreference
}

export default function ProfilePage(props: ProfilePageProps) {
  const { t } = useTranslation('profile')
  const { t: t_common } = useTranslation('common')
  const { providers, linkedProviders, preferences } = props
  const pageProps = usePage<SharedProps>().props
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const profileForm = useForm({
    fullName: pageProps.currentUser?.fullName || '',
    email: pageProps.currentUser?.email || '',
    locale: pageProps.currentUser?.locale || 'en',
  })

  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const deleteForm = useForm({
    password: '',
  })

  const preferencesForm = useForm({
    notifications: preferences.preferences.notifications,
    interface: preferences.preferences.interface,
    privacy: preferences.preferences.privacy,
  })

  const unlinkForm = useForm({})

  const profileValidation = useFormValidation({
    fullName: presets.fullName,
    email: presets.email,
    locale: [rules.required('locale')],
  })

  const passwordValidation = useFormValidation({
    current_password: presets.password,
    password: presets.password,
    password_confirmation: presets.passwordConfirmation(passwordForm.data.password),
  })

  const deleteValidation = useFormValidation({
    password: presets.password,
  })

  function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const isValid = profileValidation.validateAll(profileForm.data)
    if (!isValid) return

    const localeChanged = profileForm.data.locale !== pageProps.currentUser?.locale

    profileForm.patch('/profile', {
      onSuccess: () => {
        if (localeChanged) {
          i18n.changeLanguage(profileForm.data.locale)
        }
      },
    })
  }

  function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const isValid = passwordValidation.validateAll(passwordForm.data)
    if (!isValid) return

    passwordForm.patch('/profile/password', {
      onSuccess: () => {
        passwordForm.reset()
        passwordValidation.reset()
      },
    })
  }

  function handleAccountDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const isValid = deleteValidation.validateAll(deleteForm.data)
    if (!isValid) return

    if (confirm(t('sections.delete_account.confirm_delete'))) {
      deleteForm.delete('/profile')
    }
  }

  function handlePreferencesUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    preferencesForm.patch('/profile/preferences', {
      onSuccess: () => {
        if (preferencesForm.data.interface?.language) {
          i18n.changeLanguage(preferencesForm.data.interface.language)
        }
      },
    })
  }

  function handleUnlinkProvider(provider: string) {
    if (confirm(t('sections.connected_accounts.confirm_unlink', { provider }))) {
      unlinkForm.post(`${getProviderRoute(provider)}/unlink`)
    }
  }

  const profileSettingsContent = (
    <div className="grid gap-8">
      <Panel
        title={t('sections.profile_info.title')}
        subtitle={t('sections.profile_info.subtitle')}
      >
        <form onSubmit={handleProfileUpdate} className="grid gap-6">
          <InputGroup
            label={t('sections.profile_info.full_name')}
            name="fullName"
            type="text"
            placeholder={t('sections.profile_info.full_name_placeholder')}
            value={profileForm.data.fullName}
            errorMessage={
              profileForm.errors.fullName || profileValidation.getValidationMessage('fullName')
            }
            onChange={(e) => {
              profileForm.setData('fullName', e.target.value)
              profileValidation.handleChange('fullName', e.target.value)
            }}
            onBlur={(e) => {
              profileValidation.handleBlur('fullName', e.target.value)
            }}
            sanitize
          />
          <InputGroup
            label={t('sections.profile_info.email')}
            name="email"
            type="email"
            placeholder={t('sections.profile_info.email_placeholder')}
            value={profileForm.data.email}
            errorMessage={
              profileForm.errors.email || profileValidation.getValidationMessage('email')
            }
            onChange={(e) => {
              profileForm.setData('email', e.target.value)
              profileValidation.handleChange('email', e.target.value)
            }}
            onBlur={(e) => {
              profileValidation.handleBlur('email', e.target.value)
            }}
            required
            sanitize
          />
          {pageProps.currentUser?.pendingEmail && (
            <Banner
              type="warning"
              title={<>⏳ {t('sections.profile_info.pending_email_title')}</>}
              message={t('sections.profile_info.pending_email_message', {
                email: pageProps.currentUser?.pendingEmail,
              })}
            >
              <Button
                type="button"
                variant="danger"
                onClick={() => router.delete('/email/change/cancel')}
                fitContent
              >
                {t('sections.profile_info.cancel_email_change')}
              </Button>
            </Banner>
          )}
          <InputGroup
            label={t_common('language.selector_label')}
            name="locale"
            type="select"
            value={profileForm.data.locale}
            errorMessage={profileForm.errors.locale}
            options={[
              { label: t_common('language.en'), value: 'en' },
              { label: t_common('language.fr'), value: 'fr' },
            ]}
            onChange={(e) => {
              profileForm.setData('locale', e.target.value)
              profileValidation.handleChange('locale', e.target.value)
            }}
            required
          />
          <Button loading={profileForm.processing} fitContent>
            {t('sections.profile_info.submit')}
          </Button>
        </form>
      </Panel>
      {providers.length > 0 && (
        <Panel
          title={t('sections.connected_accounts.title')}
          subtitle={t('sections.connected_accounts.subtitle')}
        >
          <div className="grid gap-4">
            {providers.map((provider) => {
              const providerKey = provider.name.toLowerCase() as keyof LinkedProviders
              const isLinked = linkedProviders[providerKey]

              return (
                <div
                  key={provider.name}
                  className="flex align-items-center justify-content-space-between padding-4 border-solid border-1 border-neutral-300 border-radius-2"
                >
                  <div className="flex align-items-center gap-3">
                    <svg
                      className="w-size-6 h-size-6"
                      viewBox="0 0 24 24"
                      dangerouslySetInnerHTML={{ __html: provider.icon }}
                    />
                    <div>
                      <p className="fw-bold">{provider.name}</p>
                      <p className="fs-300 clr-neutral-600">
                        {isLinked
                          ? t('sections.connected_accounts.connected')
                          : t('sections.connected_accounts.not_connected')}
                      </p>
                    </div>
                  </div>
                  {isLinked ? (
                    <Button
                      variant="danger"
                      fitContent
                      onClick={() => handleUnlinkProvider(providerKey)}
                    >
                      {t('sections.connected_accounts.unlink')}
                    </Button>
                  ) : (
                    <Button
                      variant="social"
                      fitContent
                      href={getProviderRoute(provider.name)}
                      external
                    >
                      {t('sections.connected_accounts.connect')}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </Panel>
      )}
      <Panel
        title={t('sections.update_password.title')}
        subtitle={t('sections.update_password.subtitle')}
      >
        <form onSubmit={handlePasswordUpdate} className="grid gap-6">
          <InputGroup
            label={t('sections.update_password.current_password')}
            name="current_password"
            type="password"
            value={passwordForm.data.current_password}
            errorMessage={
              passwordForm.errors.current_password ||
              passwordValidation.getValidationMessage('current_password')
            }
            onChange={(e) => {
              passwordForm.setData('current_password', e.target.value)
              passwordValidation.handleChange('current_password', e.target.value)
            }}
            onBlur={(e) => {
              passwordValidation.handleBlur('current_password', e.target.value)
            }}
            required
            sanitize={false}
          />
          <InputGroup
            label={t('sections.update_password.new_password')}
            name="password"
            type="password"
            value={passwordForm.data.password}
            errorMessage={
              passwordForm.errors.password || passwordValidation.getValidationMessage('password')
            }
            onChange={(e) => {
              passwordForm.setData('password', e.target.value)
              passwordValidation.handleChange('password', e.target.value)
            }}
            onBlur={(e) => {
              passwordValidation.handleBlur('password', e.target.value)
            }}
            required
            sanitize={false}
            helpText={t('sections.update_password.password_help')}
            helpClassName={passwordValidation.getHelpClassName('password')}
          />
          <InputGroup
            label={t('sections.update_password.confirm_password')}
            name="password_confirmation"
            type="password"
            value={passwordForm.data.password_confirmation}
            errorMessage={
              passwordForm.errors.password_confirmation ||
              passwordValidation.getValidationMessage('password_confirmation')
            }
            onChange={(e) => {
              passwordForm.setData('password_confirmation', e.target.value)
              passwordValidation.handleChange('password_confirmation', e.target.value)
            }}
            onBlur={(e) => {
              passwordValidation.handleBlur('password_confirmation', e.target.value)
            }}
            required
            sanitize={false}
            helpText={t('sections.update_password.confirmation_help')}
            helpClassName={passwordValidation.getHelpClassName('password_confirmation')}
          />
          <Button loading={passwordForm.processing} fitContent>
            {t('sections.update_password.submit')}
          </Button>
        </form>
      </Panel>
      <Panel
        title={t('sections.delete_account.title')}
        subtitle={t('sections.delete_account.subtitle')}
      >
        {!showDeleteConfirm ? (
          <Button variant="danger" fitContent onClick={() => setShowDeleteConfirm(true)}>
            {t('sections.delete_account.submit')}
          </Button>
        ) : (
          <form onSubmit={handleAccountDelete} className="grid gap-6">
            <div className="padding-4 bg-red-100 border-solid border-1 border-red-300 border-radius-2">
              <p className="clr-red-600 fw-bold">{t('sections.delete_account.confirm_title')}</p>
              <p className="clr-red-600 fs-300 margin-block-start-2">
                {t('sections.delete_account.confirm_subtitle')}
              </p>
            </div>
            <InputGroup
              label={t('sections.delete_account.password')}
              name="password"
              type="password"
              placeholder={t('sections.delete_account.password_placeholder')}
              value={deleteForm.data.password}
              errorMessage={
                deleteForm.errors.password || deleteValidation.getValidationMessage('password')
              }
              onChange={(e) => {
                deleteForm.setData('password', e.target.value)
                deleteValidation.handleChange('password', e.target.value)
              }}
              onBlur={(e) => {
                deleteValidation.handleBlur('password', e.target.value)
              }}
              required
              sanitize={false}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                fitContent
                onClick={() => {
                  setShowDeleteConfirm(false)
                  deleteForm.reset()
                  deleteValidation.reset()
                }}
              >
                {t('sections.delete_account.cancel')}
              </Button>
              <Button loading={deleteForm.processing} variant="danger" fitContent>
                {t('sections.delete_account.submit')}
              </Button>
            </div>
          </form>
        )}
      </Panel>
    </div>
  )

  const preferencesContent = (
    <div className="grid gap-8">
      <Tabs
        tabs={[
          {
            id: 'notifications',
            label: t('preferences.tabs.notifications'),
            content: (
              <NotificationPreferences
                form={preferencesForm}
                onSubmit={handlePreferencesUpdate}
              />
            ),
          },
          {
            id: 'interface',
            label: t('preferences.tabs.interface'),
            content: (
              <InterfacePreferences form={preferencesForm} onSubmit={handlePreferencesUpdate} />
            ),
          },
          {
            id: 'privacy',
            label: t('preferences.tabs.privacy'),
            content: (
              <PrivacyPreferences form={preferencesForm} onSubmit={handlePreferencesUpdate} />
            ),
          },
        ]}
      />
    </div>
  )

  return (
    <>
      <Head title={t('title')} />
      <div className="container padding-block-8">
        <div className="text-center margin-block-end-8">
          <Heading level={1}>{t('title')}</Heading>
          <p className="clr-neutral-600">{t('subtitle')}</p>
        </div>
        <Tabs
          tabs={[
            {
              id: 'profile',
              label: t('tabs.profile'),
              content: profileSettingsContent,
            },
            {
              id: 'preferences',
              label: t('tabs.preferences'),
              content: preferencesContent,
            },
          ]}
        />
      </div>
    </>
  )
}
