/*
|--------------------------------------------------------------------------
| API file
|--------------------------------------------------------------------------
|
| The API file is used for defining the API routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// region Controller imports
const NotificationListController = () =>
  import('#notification/controllers/notification_list_controller')
const NotificationUnreadCountController = () =>
  import('#notification/controllers/notification_unread_count_controller')
const NotificationMarkAsReadController = () =>
  import('#notification/controllers/notification_mark_as_read_controller')
const NotificationMarkAllAsReadController = () =>
  import('#notification/controllers/notification_mark_all_as_read_controller')
const NotificationDeleteController = () =>
  import('#notification/controllers/notification_delete_controller')

// endregion

router
  .group(() => {
    router
      .group(() => {
        router.get('/', [NotificationListController, 'execute']).as('notifications.index')
        router
          .get('/unread-count', [NotificationUnreadCountController, 'execute'])
          .as('notifications.unread_count')
        router
          .put('/:id/read', [NotificationMarkAsReadController, 'execute'])
          .as('notifications.mark_as_read')
        router
          .put('/mark-all-read', [NotificationMarkAllAsReadController, 'execute'])
          .as('notifications.mark_all_as_read')
        router.delete('/:id', [NotificationDeleteController, 'execute']).as('notifications.destroy')
      })
      .prefix('/notifications')
  })
  .prefix('/api')
  .middleware(middleware.auth())
