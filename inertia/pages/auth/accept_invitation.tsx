import { FormEvent } from 'react'
import { Panel } from '~/components/elements/panel'
import { InputGroup } from '~/components/forms/input_group'
import { Button } from '~/components/elements/button'
import { Head, useForm } from '@inertiajs/react'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets, rules } from '~/helpers/validation_rules'
import { AuthIntro } from '~/components/auth/auth_intro'
import { useTranslation } from 'react-i18next'
import { Banner } from '~/components/elements/banner'

interface AcceptInvitationPageProps {
  token: string
  email: string
  fullName: string | null
}

export default function AcceptInvitationPage(props: AcceptInvitationPageProps) {
  const { token, email, fullName } = props

  const { t } = useTranslation('auth')

  const form = useForm({
    token: token,
    full_name: fullName || '',
    password: '',
    password_confirmation: '',
  })

  const validation = useFormValidation({
    full_name: [rules.minLength(2, 'full_name'), rules.maxLength(255, 'full_name')],
    password: presets.password,
    password_confirmation: presets.passwordConfirmation(form.data.password),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const isValid = validation.validateAll(form.data)

    if (isValid) {
      form.post('/accept-invitation')
    }
  }

  return (
    <>
      <Head title="Accept Invitation" />
      <div className="container">
        <AuthIntro
          title={t('invitation.title')}
          text={t('invitation.subtitle')}
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          }
        />
        <Panel>
          <Banner
            type="success"
            title={
              <div className="flex align-items-center gap-2">
                <svg
                  className="w-3 h-3 clr-green-700 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ marginTop: '0.125rem' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {
                  t('invitation.banner_title', { email: email })
                }
              </div>
            }
            message={t('invitation.banner_message')}
          />
          <form onSubmit={handleSubmit} className="grid gap-6 margin-block-start-6">
            <InputGroup
              label={t('invitation.email')}
              name="email"
              type="email"
              value={email}
              disabled
              required
              helpText={t('invitation.email_help')}
            />
            <InputGroup
              label={t('invitation.full_name')}
              name="full_name"
              type="text"
              required
              placeholder="John Doe"
              value={form.data.full_name}
              errorMessage={form.errors.full_name || validation.getValidationMessage('full_name')}
              onChange={(event) => {
                form.setData('full_name', event.target.value)
                validation.handleChange('full_name', event.target.value)
              }}
              onBlur={(event) => {
                validation.handleBlur('full_name', event.target.value)
              }}
              helpText={t('invitation.full_name_help')}
              helpClassName={validation.getHelpClassName('full_name')}
            />
            <InputGroup
              label={t('invitation.password')}
              name="password"
              type="password"
              errorMessage={form.errors.password || validation.getValidationMessage('password')}
              onChange={(event) => {
                form.setData('password', event.target.value)
                validation.handleChange('password', event.target.value)
              }}
              onBlur={(event) => {
                validation.handleBlur('password', event.target.value)
              }}
              required
              sanitize={false}
              helpText={t('invitation.password_help')}
              helpClassName={validation.getHelpClassName('password')}
            />
            <InputGroup
              label={t('invitation.confirmation')}
              name="password_confirmation"
              type="password"
              errorMessage={
                form.errors.password_confirmation ||
                validation.getValidationMessage('password_confirmation')
              }
              onChange={(event) => {
                form.setData('password_confirmation', event.target.value)
                validation.handleChange('password_confirmation', event.target.value)
              }}
              onBlur={(event) => {
                validation.handleBlur('password_confirmation', event.target.value)
              }}
              required
              sanitize={false}
              helpText={t('invitation.confirmation_help')}
              helpClassName={validation.getHelpClassName('password_confirmation')}
            />
            <Button loading={form.processing} fitContent>
              {t('invitation.submit')}
            </Button>
          </form>
        </Panel>
      </div>
    </>
  )
}
