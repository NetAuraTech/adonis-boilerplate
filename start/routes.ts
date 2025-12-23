/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// region Controller imports
const LoginController = () => import('#auth/controllers/login_controller')
const RegisterController = () => import('#auth/controllers/register_controller')
const LogoutController = () => import('#auth/controllers/logout_controller')
const ForgotPasswordController = () => import('#auth/controllers/forgot_password_controller')
const ResetPasswordController = () => import('#auth/controllers/reset_password_controller')
const SocialController = () => import('#auth/controllers/social_controller')
const ProfileShowController = () => import('#profile/controllers/profile_show_controller')
const ProfileUpdateController = () => import('#profile/controllers/profile_update_controller')
const ProfileDeleteController = () => import('#profile/controllers/profile_delete_controller')
const ProfileCleanNotificationsController = () =>
  import('#profile/controllers/profile_clean_notifications_controller')
const ProfileUpdatePasswordController = () =>
  import('#profile/controllers/profile_update_password_controller')

// endregion

router.on('/').renderInertia('landing').as('landing')

router
  .group(() => {
    router.get('/login', [LoginController, 'render']).as('auth.login')
    router
      .post('/login', [LoginController, 'execute'])
      .use(middleware.throttle({ max: 5, window: 900 }))

    router.get('/register', [RegisterController, 'render']).as('auth.register')
    router
      .post('/register', [RegisterController, 'execute'])
      .use(middleware.throttle({ max: 3, window: 3600 }))

    router.get('/forgot-password', [ForgotPasswordController, 'render']).as('auth.forgot_password')
    router
      .post('/forgot-password', [ForgotPasswordController, 'execute'])
      .use(middleware.throttle({ max: 3, window: 3600 }))

    router
      .get('/reset-password/:token', [ResetPasswordController, 'render'])
      .as('auth.reset_password')
    router
      .post('/reset-password', [ResetPasswordController, 'execute'])
      .use(middleware.throttle({ max: 3, window: 900 }))
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('/logout', [LogoutController, 'execute']).as('auth.logout')

    router
      .group(() => {
        router.get('/define-password', [SocialController, 'render']).as('oauth.define.password')
        router.post('/define-password', [SocialController, 'execute'])
        router.post('/:provider/unlink', [SocialController, 'unlink']).as('oauth.unlink')
      })
      .prefix('oauth')
  })
  .use(middleware.auth())

router
  .group(() => {
    router.get('/:provider', [SocialController, 'redirect']).as('oauth.redirect')
    router.get('/:provider/callback', [SocialController, 'callback']).as('oauth.callback')
  })
  .prefix('oauth')

router
  .group(() => {
    router.get('/', [ProfileShowController, 'render']).as('profile.show')

    router.put('/', [ProfileUpdateController, 'execute']).as('profile.update')

    router
      .put('/password', [ProfileUpdatePasswordController, 'execute'])
      .as('profile.password.update')

    router.delete('/', [ProfileDeleteController, 'execute']).as('profile.delete')

    router
      .delete('/notifications', [ProfileCleanNotificationsController, 'execute'])
      .as('profile.notifications.clean')
  })
  .prefix('profile')
  .use(middleware.auth())
