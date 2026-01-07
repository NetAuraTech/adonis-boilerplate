import { FormEvent } from 'react'
import { Panel } from '~/components/elements/panel'
import { InputGroup } from '~/components/forms/input_group'
import { Button } from '~/components/elements/button'
import { Head, useForm } from '@inertiajs/react'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets, rules } from '~/helpers/validation_rules'

interface AcceptInvitationPageProps {
  token: string
  email: string
  fullName: string | null
}

export default function AcceptInvitationPage(props: AcceptInvitationPageProps) {
  const { token, email, fullName } = props

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
        <div className="text-center padding-block-8">
          <div className="display-inline-flex align-items-center justify-content-center bg-primary-300 clr-neutral-900 border-radius-4 padding-4 margin-block-end-4">
            <svg
              className="w-size-10 h-size-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="heading-1">Welcome! Complete Your Account</h1>
          <p className="clr-neutral-600">
            You've been invited to join. Set up your account to get started.
          </p>
        </div>

        <Panel>
          <div className="padding-4 bg-green-050 border-1 border-solid border-green-300 border-radius-2 margin-block-end-6">
            <div className="flex-group gap-2 align-items-start">
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
              <div>
                <p className="fs-400 fw-semi-bold clr-green-800">Invitation for {email}</p>
                <p className="fs-300 clr-green-700 margin-block-start-1">
                  Complete the form below to activate your account. Your email will be automatically
                  verified.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6">
            <InputGroup
              label="Email Address"
              name="email"
              type="email"
              value={email}
              disabled
              helpText="This email address was invited by an administrator"
            />

            <InputGroup
              label="Full Name"
              name="full_name"
              type="text"
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
              helpText="Your display name (you can change this later)"
              helpClassName={validation.getHelpClassName('full_name')}
            />

            <InputGroup
              label="Password"
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
              helpText="At least 8 characters"
              helpClassName={validation.getHelpClassName('password')}
            />

            <InputGroup
              label="Confirm Password"
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
              helpText="Must match your password"
              helpClassName={validation.getHelpClassName('password_confirmation')}
            />

            <Button loading={form.processing} fitContent>
              Create Account
            </Button>
          </form>
        </Panel>
      </div>
    </>
  )
}
