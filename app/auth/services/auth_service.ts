import User from '#auth/models/user'
import Role from '#core/models/role'
import { Exception } from '@adonisjs/core/exceptions'
import { inject } from '@adonisjs/core'
import LogService from '#core/services/log_service'

/**
 * Centralized service for authentication logic
 * Throws typed exceptions that controllers only need to catch
 */
@inject()
export default class AuthService {
  constructor(protected logService: LogService) {}

  /**
   * Authenticates a user with email and password
   *
   * @throws Exception E_INVALID_CREDENTIALS if credentials are invalid
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const user = await User.verifyCredentials(email, password)

      this.logService.logAuth('login.success', {
        userId: user.id,
        userEmail: user.email,
      })

      return user
    } catch (error) {
      this.logService.logAuth('login.failed', {
        userEmail: email,
      })

      throw new Exception('Invalid credentials', {
        status: 401,
        code: 'E_INVALID_CREDENTIALS',
      })
    }
  }

  /**
   * Registers a new user
   *
   * @throws Exception E_EMAIL_EXISTS if the email already exists
   */
  async register(data: { email: string; password: string }): Promise<User> {
    const existingUser = await User.findBy('email', data.email)

    if (existingUser) {
      this.logService.logAuth('register.failed.email_exists', {
        userEmail: data.email,
      })

      throw new Exception('Email already exists', {
        status: 409,
        code: 'E_EMAIL_EXISTS',
      })
    }

    const userRole = await Role.findBy('slug', 'user')

    const user = await User.create({
      email: data.email,
      password: data.password,
      roleId: userRole?.id || null,
    })

    this.logService.logAuth('register.success', {
      userId: user.id,
      userEmail: user.email,
    })

    return user
  }

  /**
   * Logs a user out
   * Can be extended with additional logic (logs, etc.)
   */
  async logout(userId: number): Promise<void> {
    this.logService.logAuth('logout', { userId })
  }
}
