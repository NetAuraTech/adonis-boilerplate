import transmit from '@adonisjs/transmit/services/main'

/**
 * Define SSE channels and their authorization logic
 * Channels are used for real-time communication via Server-Sent Events
 */

/**
 * User notification channel
 *
 *  pattern: user/{userId}/notifications
 *
 * Authorization: Only the user themselves can subscribe to their notification channel
 */
transmit.authorize<{ userId: string }>('user/:userId/notifications', (ctx, { userId }) => {
  const authUser = ctx.auth.user

  // User must be authenticated
  if (!authUser) {
    return false
  }

  // User can only subscribe to their own notification channel
  return authUser.id === Number(userId)
})
