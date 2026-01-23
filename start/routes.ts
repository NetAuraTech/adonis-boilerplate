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
import transmit from '@adonisjs/transmit/services/main'
const UserPreferenceUpdateController = () =>
  import('#profile/controllers/user_preference_update_controller')
const TestNotificationController = () =>
  import('#notification/controllers/test_notification_controller')

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

const EmailVerificationController = () => import('#auth/controllers/email_verification_controller')
const EmailResendController = () => import('#auth/controllers/email_resend_controller')
const EmailChangeController = () => import('#auth/controllers/email_change_controller')
const EmailChangeCancelController = () => import('#auth/controllers/email_change_cancel_controller')

const AdminDashboardController = () =>
  import('#admin/controllers/dashboard/admin_dashboard_controller')

const AdminUsersIndexController = () =>
  import('#admin/controllers/users/admin_users_index_controller')
const AdminUsersShowController = () =>
  import('#admin/controllers/users/admin_users_show_controller')
const AdminUsersUpdateController = () =>
  import('#admin/controllers/users/admin_users_update_controller')
const AdminUsersDeleteController = () =>
  import('#admin/controllers/users/admin_users_delete_controller')

const AdminRolesIndexController = () =>
  import('#admin/controllers/roles/admin_roles_index_controller')
const AdminRolesShowController = () =>
  import('#admin/controllers/roles/admin_roles_show_controller')
const AdminRolesCreateController = () =>
  import('#admin/controllers/roles/admin_roles_create_controller')
const AdminRolesUpdateController = () =>
  import('#admin/controllers/roles/admin_roles_update_controller')
const AdminRolesDeleteController = () =>
  import('#admin/controllers/roles/admin_roles_delete_controller')

const AdminPermissionsIndexController = () =>
  import('#admin/controllers/permissions/admin_permissions_index_controller')
const AdminPermissionsShowController = () =>
  import('#admin/controllers/permissions/admin_permissions_show_controller')
const AdminPermissionsCreateController = () =>
  import('#admin/controllers/permissions/admin_permissions_create_controller')
const AdminPermissionsUpdateController = () =>
  import('#admin/controllers/permissions/admin_permissions_update_controller')
const AdminPermissionsDeleteController = () =>
  import('#admin/controllers/permissions/admin_permissions_delete_controller')

const AcceptInvitationController = () => import('#auth/controllers/accept_invitation_controller')
const AdminUsersResendInvitationController = () =>
  import('#admin/controllers/users/admin_users_resend_invitation_controller')
const AdminUsersCreateController = () =>
  import('#admin/controllers/users/admin_users_create_controller')
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
    router
      .get('/accept-invitation/:token', [AcceptInvitationController, 'render'])
      .as('auth.accept_invitation')
      .use(middleware.throttle({ max: 3, window: 900 }))

    router
      .post('/accept-invitation', [AcceptInvitationController, 'execute'])
      .as('auth.accept_invitation.submit')
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

    router
      .group(() => {
        router.get('/verify/:token', [EmailVerificationController, 'execute']).as('email.verify')
        router
          .post('/resend', [EmailResendController, 'execute'])
          .as('email.resend')
          .use(middleware.throttle({ max: 15, window: 900 }))

        router.get('/change/:token', [EmailChangeController, 'render']).as('email.change.show')
        router.post('/change/:token', [EmailChangeController, 'execute']).as('email.change.confirm')
        router
          .delete('/change/cancel', [EmailChangeCancelController, 'execute'])
          .as('email.change.cancel')
          .use(middleware.auth())
      })
      .prefix('email')
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

    router
      .patch('/', [ProfileUpdateController, 'execute'])
      .as('profile.update')
      .use(middleware.verified())

    router
      .patch('/password', [ProfileUpdatePasswordController, 'execute'])
      .as('profile.password.update')
      .use(middleware.verified())

    router
      .delete('/', [ProfileDeleteController, 'execute'])
      .as('profile.delete')
      .use(middleware.verified())

    router
      .delete('/notifications', [ProfileCleanNotificationsController, 'execute'])
      .as('profile.notifications.clean')
      .use(middleware.verified())

    router
      .patch('/preferences', [UserPreferenceUpdateController, 'execute'])
      .as('preferences.update')
      .use(middleware.verified())
  })
  .prefix('profile')
  .use(middleware.auth())

router
  .group(() => {
    // ========================================
    // DASHBOARD
    // ========================================
    router
      .get('/', [AdminDashboardController, 'render'])
      .as('admin.dashboard')
      .use(middleware.permission({ permissions: ['admin.access'] }))

    // ========================================
    // USERS MANAGEMENT
    // ========================================
    router
      .group(() => {
        router
          .get('/', [AdminUsersIndexController, 'render'])
          .as('admin.users.index')
          .use(middleware.permission({ permissions: ['users.view'] }))
        router
          .get('/create', [AdminUsersCreateController, 'render'])
          .as('admin.users.create')
          .use(middleware.permission({ permissions: ['users.create'] }))
        router
          .post('/', [AdminUsersCreateController, 'execute'])
          .as('admin.users.store')
          .use(middleware.permission({ permissions: ['users.create'] }))
        router
          .get('/:id/edit', [AdminUsersUpdateController, 'render'])
          .as('admin.users.edit')
          .use(middleware.permission({ permissions: ['users.update'] }))
        router
          .get('/:id', [AdminUsersShowController, 'render'])
          .as('admin.users.show')
          .use(middleware.permission({ permissions: ['users.view'] }))
        router
          .post('/:id/resend-invitation', [AdminUsersResendInvitationController, 'execute'])
          .as('admin.users.resend_invitation')
          .use(middleware.permission({ permissions: ['users.create', 'users.update'] }))
        router
          .put('/:id', [AdminUsersUpdateController, 'execute'])
          .as('admin.users.update')
          .use(middleware.permission({ permissions: ['users.update'] }))
        router
          .delete('/:id', [AdminUsersDeleteController, 'execute'])
          .as('admin.users.delete')
          .use(middleware.permission({ permissions: ['users.delete'] }))
      })
      .prefix('users')

    // ========================================
    // ROLES MANAGEMENT
    // ========================================
    router
      .group(() => {
        router
          .get('/', [AdminRolesIndexController, 'render'])
          .as('admin.roles.index')
          .use(middleware.permission({ permissions: ['roles.view'] }))
        router
          .get('/create', [AdminRolesCreateController, 'render'])
          .as('admin.roles.create')
          .use(middleware.permission({ permissions: ['roles.create'] }))
        router
          .post('/', [AdminRolesCreateController, 'execute'])
          .as('admin.roles.store')
          .use(middleware.permission({ permissions: ['roles.create'] }))
        router
          .get('/:id/edit', [AdminRolesUpdateController, 'render'])
          .as('admin.roles.edit')
          .use(middleware.permission({ permissions: ['roles.update'] }))
        router
          .get('/:id', [AdminRolesShowController, 'render'])
          .as('admin.roles.show')
          .use(middleware.permission({ permissions: ['roles.view'] }))
        router
          .put('/:id', [AdminRolesUpdateController, 'execute'])
          .as('admin.roles.update')
          .use(middleware.permission({ permissions: ['roles.update'] }))
        router
          .delete('/:id', [AdminRolesDeleteController, 'execute'])
          .as('admin.roles.delete')
          .use(middleware.permission({ permissions: ['roles.delete'] }))
      })
      .prefix('roles')

    // ========================================
    // PERMISSIONS MANAGEMENT
    // ========================================
    router
      .group(() => {
        router
          .get('/', [AdminPermissionsIndexController, 'render'])
          .as('admin.permissions.index')
          .use(middleware.permission({ permissions: ['permissions.view'] }))
        router
          .get('/create', [AdminPermissionsCreateController, 'render'])
          .as('admin.permissions.create')
          .use(middleware.permission({ permissions: ['permissions.create'] }))
        router
          .post('/', [AdminPermissionsCreateController, 'execute'])
          .as('admin.permissions.store')
          .use(middleware.permission({ permissions: ['permissions.create'] }))
        router
          .get('/:id/edit', [AdminPermissionsUpdateController, 'render'])
          .as('admin.permissions.edit')
          .use(middleware.permission({ permissions: ['permissions.update'] }))
        router
          .get('/:id', [AdminPermissionsShowController, 'render'])
          .as('admin.permissions.show')
          .use(middleware.permission({ permissions: ['permissions.view'] }))
        router
          .put('/:id', [AdminPermissionsUpdateController, 'execute'])
          .as('admin.permissions.update')
          .use(middleware.permission({ permissions: ['permissions.update'] }))
        router
          .delete('/:id', [AdminPermissionsDeleteController, 'execute'])
          .as('admin.permissions.delete')
          .use(middleware.permission({ permissions: ['permissions.delete'] }))
      })
      .prefix('permissions')
  })
  .prefix('admin')
  .use(middleware.auth())
  .use(middleware.verified())

router.post('/theme', async ({ request, response }) => {
  const { theme } = request.only(['theme'])
  response.cookie('theme', theme, {
    maxAge: 365 * 24 * 60 * 60,
    httpOnly: false,
  })
  return response.json({ success: true })
})

if (process.env.NODE_ENV === 'development') {
  router
    .group(() => {
      router
        .get('/notifications/random', [TestNotificationController, 'execute'])
        .as('test.notifications.random')
    })
    .prefix('/test')
    .use(middleware.auth())
}

transmit.registerRoutes()
