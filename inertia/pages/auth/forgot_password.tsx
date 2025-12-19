import { FormEvent } from 'react'
import { Panel } from '#components/elements/panel'
import { InputGroup } from '#components/forms/input_group'
import { Button } from '#components/elements/button'
import { Head, useForm } from '@inertiajs/react'

export default function ForgotPasswordPage() {
  const form = useForm({
    email: '',
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.post('/forgot-password')
  }

  return (
    <>
      <Head title="Forgot Password" />
      <div className="container">
        <div className="text-center padding-block-8">
          <div className="display-inline-flex align-items-center justify-content-center bg-primary-300 clr-neutral-900 border-radius-4 padding-4 margin-block-end-4">
            <svg className="w-size-10 h-size-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="heading-1">Reset Password</h1>
          <p className="clr-neutral-600">Enter your email and we'll send you a link to reset your password.</p>
        </div>
        <Panel>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <InputGroup
              label="Email address"
              name="email"
              type="email"
              placeholder="your-email@example.com"
              value={form.data.email}
              errorMessage={form.errors.email}
              onChange={(e) => form.setData('email', e.target.value)}
              required
            />
            <div className="flex gap-3">
              <Button
                loading={form.processing}
                fitContent
              >
                Send Reset Link
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
