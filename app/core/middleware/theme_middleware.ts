import { HttpContext } from '@adonisjs/core/http'

export default class ThemeMiddleware {
  async handle({ request, inertia }: HttpContext, next: () => Promise<void>) {
    const theme = request.cookie('theme') || null
    inertia.share({ theme })
    await next()
  }
}
