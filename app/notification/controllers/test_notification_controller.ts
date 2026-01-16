import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import NotificationService from '#notification/services/notification_service'
import ErrorHandlerService from '#core/services/error_handler_service'

/**
 * Controller for creating random test notifications
 * POST /test/notifications/random
 */
@inject()
export default class TestNotificationController {
  constructor(
    protected notificationService: NotificationService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth, response } = ctx

    try {
      const user = auth.getUserOrFail()

      // Random notification types
      const types = ['info', 'success', 'warning', 'error', 'system']
      const randomType = types[Math.floor(Math.random() * types.length)]

      // Random notification templates based on type
      const templates = {
        info: [
          {
            title: 'New Feature Available',
            message: 'Check out our latest feature updates in your dashboard!',
            data: { feature: 'dashboard-v2', version: '2.0.0' },
          },
          {
            title: 'System Maintenance',
            message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM.',
            data: { scheduledAt: new Date(Date.now() + 86400000).toISOString() },
          },
          {
            title: 'Profile Views',
            message: 'Your profile has been viewed 15 times this week.',
            data: { views: 15, period: 'week' },
          },
        ],
        success: [
          {
            title: 'Payment Successful',
            message: 'Your payment of $99.99 has been processed successfully.',
            data: { amount: 99.99, currency: 'USD', transactionId: 'TXN123456' },
          },
          {
            title: 'Account Verified',
            message: 'Your account has been successfully verified!',
            data: { verifiedAt: new Date().toISOString() },
          },
          {
            title: 'Upload Complete',
            message: 'Your file "document.pdf" has been uploaded successfully.',
            data: { filename: 'document.pdf', size: '2.4 MB' },
          },
        ],
        warning: [
          {
            title: 'Password Expiring Soon',
            message: 'Your password will expire in 7 days. Please update it.',
            data: { expiresIn: 7, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() },
          },
          {
            title: 'Storage Almost Full',
            message: 'You have used 95% of your storage space.',
            data: { usage: 95, total: 100, unit: 'GB' },
          },
          {
            title: 'Unusual Activity Detected',
            message: 'We detected a login from a new device. Was this you?',
            data: { device: 'Chrome on Windows', location: 'Paris, France' },
          },
        ],
        error: [
          {
            title: 'Payment Failed',
            message: 'Your payment could not be processed. Please update your payment method.',
            data: { reason: 'insufficient_funds', retryable: true },
          },
          {
            title: 'Sync Error',
            message: 'Failed to sync your data. Please try again later.',
            data: { lastSyncAt: new Date(Date.now() - 3600000).toISOString() },
          },
          {
            title: 'Upload Failed',
            message: 'Failed to upload "report.xlsx". File size exceeds limit.',
            data: { filename: 'report.xlsx', size: '15 MB', limit: '10 MB' },
          },
        ],
        system: [
          {
            title: 'Welcome Back!',
            message: "We've missed you! Check out what's new since your last visit.",
            data: { lastLogin: new Date(Date.now() - 7 * 86400000).toISOString() },
          },
          {
            title: 'Terms of Service Updated',
            message: 'Our terms of service have been updated. Please review the changes.',
            data: { effectiveDate: new Date(Date.now() + 30 * 86400000).toISOString() },
          },
          {
            title: 'New Message',
            message: 'You have received a new message from Support Team.',
            data: { from: 'Support Team', messageId: 'MSG789' },
          },
        ],
      }

      // Get random template for the selected type
      const typeTemplates = templates[randomType as keyof typeof templates]
      const randomTemplate = typeTemplates[Math.floor(Math.random() * typeTemplates.length)]

      // Create the notification
      const notification = await this.notificationService.create({
        userId: user.id,
        type: randomType,
        title: randomTemplate.title,
        message: randomTemplate.message,
        data: randomTemplate.data,
      })

      return response.ok({
        message: 'Test notification created successfully',
        notification,
      })
    } catch (error) {
      return this.errorHandler.handleApi(ctx, error)
    }
  }
}
