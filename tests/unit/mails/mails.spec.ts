import { test } from '@japa/runner'
import VerifyEmailMail from '#auth/mails/verify_email_mail'
import { UserFactory } from '#tests/helpers/factories'

test.group('Mails', () => {
  test('VerifyEmailMail: should prepare message correctly', async ({ assert }) => {
    const user = await UserFactory.create({ email: 'test@example.com' })
    const mockI18n = { t: (key: string) => key } as any
    const mail = new VerifyEmailMail(user, 'http://verify.link', mockI18n)

    mail.prepare()

    assert.equal(mail.message.toJSON().message.to?.[0], 'test@example.com')
    assert.equal(mail.message.toJSON().message.subject, 'emails.verify_email.subject')
  })
})
