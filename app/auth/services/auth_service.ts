import User from '#auth/models/user'
import Role from '#core/models/role'
import logger from '@adonisjs/core/services/logger'
import { Exception } from '@adonisjs/core/exceptions'

/**
 * Centralized service for authentication logic
 * Throws typed exceptions that controllers only need to catch
 */
export default class AuthService {
  /**
   * Authenticates a user with email and password
   *
   * @throws Exception E_INVALID_CREDENTIALS if credentials are invalid
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const user = await User.verifyCredentials(email, password)

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
      })

      return user
    } catch (error) {
      logger.warn('Failed login attempt', {
        email,
        error: error.message,
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

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    })

    return user
  }

  /**
   * Logs a user out
   * Can be extended with additional logic (logs, etc.)
   */
  async logout(userId: number): Promise<void> {
    logger.info('User logged out', { userId })
  }
}
