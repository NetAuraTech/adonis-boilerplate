import { FormEvent, useState } from 'react'
import { Panel } from '#components/elements/panel'
import { InputGroup } from '#components/forms/input_group'
import { Button } from '#components/elements/button'
import { Head, useForm, usePage } from '@inertiajs/react'
import type { OAuthProvider } from '~/types/oauth'
import type { SharedProps } from '@adonisjs/inertia/types'
import { getProviderRoute } from '~/helpers/oauth'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

interface LinkedProviders {
  github: boolean
  google: boolean
  facebook: boolean
}

interface ProfilePageProps {
  notifications: any[]
  providers: OAuthProvider[]
  linkedProviders: LinkedProviders
}

export default function ProfilePage(props: ProfilePageProps) {
  const { t } = useTranslation('profile')
  const { t: t_common } = useTranslation('common')
  const { providers, linkedProviders } = props
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

  const unlinkForm = useForm({})

  function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const localeChanged = profileForm.data.locale !== pageProps.currentUser?.locale

    profileForm.put('/profile', {
      onSuccess: () => {
        if (localeChanged) {
          i18n.changeLanguage(profileForm.data.locale)
        }
      }
    })
  }

  function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    passwordForm.put('/profile/password', {
      onSuccess: () => {
        passwordForm.reset()
      },
    })
  }

  function handleAccountDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (confirm(t('sections.delete_account.confirm_delete'))) {
      deleteForm.delete('/profile')
    }
  }

  function handleUnlinkProvider(provider: string) {
    if (confirm(t('sections.connected_accounts.confirm_unlink', { provider }))) {
      unlinkForm.post(`${getProviderRoute(provider)}/unlink`)
    }
  }

  const isPasswordValid = passwordForm.data.password.length >= 8
  const isConfirmValid =
    passwordForm.data.password_confirmation === passwordForm.data.password &&
    passwordForm.data.password !== ''

  return (
    <>
      <Head title={t('title')} />
      <div className="container padding-block-8">
        <div className="text-center margin-block-end-8">
          <h1 className="heading-1">{t('title')}</h1>
          <p className="clr-neutral-600">{t('subtitle')}</p>
        </div>
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
                errorMessage={profileForm.errors.fullName}
                onChange={(e) => profileForm.setData('fullName', e.target.value)}
              />
              <InputGroup
                label={t('sections.profile_info.email')}
                name="email"
                type="email"
                placeholder={t('sections.profile_info.email_placeholder')}
                value={profileForm.data.email}
                errorMessage={profileForm.errors.email}
                onChange={(e) => profileForm.setData('email', e.target.value)}
                required
              />
              <InputGroup
                label={t_common('language.selector_label')}
                name="locale"
                type="select"
                value={profileForm.data.locale}
                errorMessage={profileForm.errors.locale}
                options={[
                  {
                    label: t_common('language.en'),
                    value: 'en'
                  },
                  {
                    label: t_common('language.fr'),
                    value: 'fr'
                  }
                ]}
                onChange={(e) => profileForm.setData('locale', e.target.value)}
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
                errorMessage={passwordForm.errors.current_password}
                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                required
              />
              <InputGroup
                label={t('sections.update_password.new_password')}
                name="password"
                type="password"
                value={passwordForm.data.password}
                errorMessage={passwordForm.errors.password}
                onChange={(e) => passwordForm.setData('password', e.target.value)}
                required
                helpText={t('sections.update_password.password_help')}
                helpClassName={isPasswordValid ? 'clr-green-500' : 'clr-red-400'}
              />
              <InputGroup
                label={t('sections.update_password.confirm_password')}
                name="password_confirmation"
                type="password"
                value={passwordForm.data.password_confirmation}
                errorMessage={passwordForm.errors.password_confirmation}
                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                required
                helpText={t('sections.update_password.confirmation_help')}
                helpClassName={isConfirmValid ? 'clr-green-500' : 'clr-red-400'}
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
                  <p className="clr-red-600 fw-bold">
                    {t('sections.delete_account.confirm_title')}
                  </p>
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
                  errorMessage={deleteForm.errors.password}
                  onChange={(e) => deleteForm.setData('password', e.target.value)}
                  required
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    fitContent
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      deleteForm.reset()
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
      </div>
    </>
  )
}
