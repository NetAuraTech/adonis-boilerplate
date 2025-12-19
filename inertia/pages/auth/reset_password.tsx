import { FormEvent } from 'react'
import { Panel } from '#components/elements/panel'
import { InputGroup } from '#components/forms/input_group'
import { Button } from '#components/elements/button'
import { Head, useForm } from '@inertiajs/react'

interface ResetPasswordPageProps {
  token: string
}

export default function ResetPasswordPage(props: ResetPasswordPageProps) {
  const { token } = props
  const form = useForm({token: token, password: '', password_confirmation: ''})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.post('/reset-password')
  }

  const isPasswordValid = form.data.password.length >= 8
  const isConfirmValid = form.data.password_confirmation === form.data.password && form.data.password !== ''

  return (
    <>
      <Head title="Reset Password" />
      <div className="container">
        <div className="text-center padding-block-8">
          <div className="display-inline-flex align-items-center justify-content-center bg-primary-300 clr-neutral-900 border-radius-4 padding-4 margin-block-end-4">
            <svg className="w-size-10 h-size-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="heading-1">Reset Password</h1>
          <p className="clr-neutral-600">Enter your new password.</p>
        </div>
        <Panel>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <InputGroup
              label="New password"
              name="password"
              type="password"
              errorMessage={form.errors.password}
              onChange={(event) => form.setData('password', event.target.value)}
              required={true}
              helpText="For optimal security, your password must be at least 8 characters long."
              helpClassName={isPasswordValid ? 'clr-green-500' : 'clr-red-400'}
            />
            <InputGroup
              label="Confirmation"
              name="password_confirmation"
              type="password"
              errorMessage={form.errors.password_confirmation}
              onChange={(event) => form.setData('password_confirmation', event.target.value)}
              required={true}
              helpText="Re-enter your password to verify that there are no typing errors."
              helpClassName={isConfirmValid ? 'clr-green-500' : 'clr-red-400'}
            />
            <div className="flex gap-3">
              <Button
                loading={form.processing}
                fitContent
              >
                Reset
              </Button>
              <Button
                fitContent
                href="/login"
                variant="outline"
              >
                Back to login
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  )
}
