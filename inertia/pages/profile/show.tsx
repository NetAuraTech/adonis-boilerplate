import { FormEvent, useState } from 'react'
import { Panel } from '#components/elements/panel'
import { InputGroup } from '#components/forms/input_group'
import { Button } from '#components/elements/button'
import { Head, useForm, usePage } from '@inertiajs/react'
import type { OAuthProvider } from '~/types/oauth'
import type { SharedProps } from '@adonisjs/inertia/types'
import { getProviderRoute } from '~/helpers/oauth'

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
  const { providers, linkedProviders } = props
  const pageProps = usePage<SharedProps>().props
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const profileForm = useForm({
    fullName: pageProps.currentUser?.fullName || '',
    email: pageProps.currentUser?.email || '',
  })

  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const deleteForm = useForm({
    password: '',
  })

  const unlinkForm = useForm({
  })

  function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    profileForm.put('/profile')
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
    if (confirm('Are you sure you want to delete your account? This action is irreversible.')) {
      deleteForm.delete('/profile')
    }
  }

  function handleUnlinkProvider(provider: string) {
    if (confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      unlinkForm.post(`${getProviderRoute(provider)}/unlink`)
    }
  }

  const isPasswordValid = passwordForm.data.password.length >= 8
  const isConfirmValid = passwordForm.data.password_confirmation === passwordForm.data.password && passwordForm.data.password !== ''

  return (
    <>
      <Head title="Profile" />
      <div className="container padding-block-8">
        <div className="text-center margin-block-end-8">
          <h1 className="heading-1">My Profile</h1>
          <p className="clr-neutral-600">Manage your account settings and preferences</p>
        </div>
        <div className="grid gap-8">
          <Panel
            title="Profile Information"
            subtitle="Update your account's profile information and email address."
          >
            <form onSubmit={handleProfileUpdate} className="grid gap-6">
              <InputGroup
                label="Full Name"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={profileForm.data.fullName}
                errorMessage={profileForm.errors.fullName}
                onChange={(e) => profileForm.setData('fullName', e.target.value)}
              />
              <InputGroup
                label="Email Address"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={profileForm.data.email}
                errorMessage={profileForm.errors.email}
                onChange={(e) => profileForm.setData('email', e.target.value)}
                required
              />
              <div>
                <Button
                  loading={profileForm.processing}
                  fitContent
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Panel>
          {providers.length > 0 && (
            <Panel
              title="Connected Accounts"
              subtitle="Manage your OAuth provider connections."
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
                            {isLinked ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      {isLinked ? (
                        <Button
                          variant="danger"
                          fitContent
                          onClick={() => handleUnlinkProvider(providerKey)}
                        >
                          Unlink
                        </Button>
                      ) : (
                        <Button
                          variant="social"
                          fitContent
                          href={getProviderRoute(provider.name)}
                          external
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Panel>
          )}
          <Panel
            title="Update Password"
            subtitle="Ensure your account is using a long, random password to stay secure."
          >
            <form onSubmit={handlePasswordUpdate} className="grid gap-6">
              <InputGroup
                label="Current Password"
                name="current_password"
                type="password"
                value={passwordForm.data.current_password}
                errorMessage={passwordForm.errors.current_password}
                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                required
              />
              <InputGroup
                label="New Password"
                name="password"
                type="password"
                value={passwordForm.data.password}
                errorMessage={passwordForm.errors.password}
                onChange={(e) => passwordForm.setData('password', e.target.value)}
                required
                helpText="For optimal security, your password must be at least 8 characters long."
                helpClassName={isPasswordValid ? 'clr-green-500' : 'clr-red-400'}
              />
              <InputGroup
                label="Confirm Password"
                name="password_confirmation"
                type="password"
                value={passwordForm.data.password_confirmation}
                errorMessage={passwordForm.errors.password_confirmation}
                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                required
                helpText="Re-enter your password to verify that there are no typing errors."
                helpClassName={isConfirmValid ? 'clr-green-500' : 'clr-red-400'}
              />
              <div>
                <Button
                  loading={passwordForm.processing}
                  fitContent
                >
                  Update Password
                </Button>
              </div>
            </form>
          </Panel>
          <Panel
            title="Delete Account"
            subtitle="Once your account is deleted, all of its resources and data will be permanently deleted."
          >
            {!showDeleteConfirm ? (
              <Button
                variant="danger"
                fitContent
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            ) : (
              <form onSubmit={handleAccountDelete} className="grid gap-6">
                <div className="padding-4 bg-red-100 border-solid border-1 border-red-300 border-radius-2">
                  <p className="clr-red-600 fw-bold">
                    Are you sure you want to delete your account?
                  </p>
                  <p className="clr-red-600 fs-300 margin-block-start-2">
                    Once your account is deleted, all of its resources and data will be permanently deleted.
                    Please enter your password to confirm you would like to permanently delete your account.
                  </p>
                </div>
                <InputGroup
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Enter your password to confirm"
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
                    Cancel
                  </Button>
                  <Button
                    loading={deleteForm.processing}
                    variant="danger"
                    fitContent
                  >
                    Delete Account
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
