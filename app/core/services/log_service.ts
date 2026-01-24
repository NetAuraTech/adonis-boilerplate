import logger from '@adonisjs/core/services/logger'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum LogCategory {
  AUTH = 'auth',
  API = 'api',
  DATABASE = 'database',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  SYSTEM = 'system',
}

export interface LogContext {
  userId?: number
  userEmail?: string
  ip?: string
  userAgent?: string
  method?: string
  url?: string
  statusCode?: number
  duration?: number
  [key: string]: any
}

export interface LogEntry {
  message: string
  level?: LogLevel
  category?: LogCategory
  context?: LogContext
  error?: Error
  metadata?: Record<string, any>
}

@inject()
export default class LogService {
  /**
   * Log a debug message
   */
  debug(entry: LogEntry): void {
    this.log({ ...entry, level: LogLevel.DEBUG })
  }

  /**
   * Log an info message
   */
  info(entry: LogEntry): void {
    this.log({ ...entry, level: LogLevel.INFO })
  }

  /**
   * Log a warning message
   */
  warn(entry: LogEntry): void {
    this.log({ ...entry, level: LogLevel.WARN })
  }

  /**
   * Log an error message
   */
  error(entry: LogEntry): void {
    this.log({ ...entry, level: LogLevel.ERROR })
  }

  /**
   * Log a fatal error message
   */
  fatal(entry: LogEntry): void {
    this.log({ ...entry, level: LogLevel.FATAL })
  }

  /**
   * Main log method - handles all log entries
   */
  log(entry: LogEntry): void {
    const {
      message,
      level = LogLevel.INFO,
      category = LogCategory.SYSTEM,
      context = {},
      error,
      metadata = {},
    } = entry

    const logData: Record<string, any> = {
      message,
      category,
      timestamp: new Date().toISOString(),
      ...context,
      ...metadata,
    }

    if (error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    switch (level) {
      case LogLevel.DEBUG:
        logger.debug(logData, message)
        break
      case LogLevel.INFO:
        logger.info(logData, message)
        break
      case LogLevel.WARN:
        logger.warn(logData, message)
        break
      case LogLevel.ERROR:
        logger.error(logData, message)
        break
      case LogLevel.FATAL:
        logger.fatal(logData, message)
        break
    }
  }

  /**
   * Log authentication event
   */
  logAuth(action: string, context: LogContext): void {
    this.info({
      message: `Authentication: ${action}`,
      category: LogCategory.AUTH,
      context,
    })
  }

  /**
   * Log security event
   */
  logSecurity(message: string, context: LogContext, level: LogLevel = LogLevel.WARN): void {
    this.log({
      message,
      level,
      category: LogCategory.SECURITY,
      context,
    })
  }

  /**
   * Log API request
   */
  logApiRequest(ctx: HttpContext, duration?: number): void {
    this.info({
      message: 'API Request',
      category: LogCategory.API,
      context: {
        method: ctx.request.method(),
        url: ctx.request.url(),
        ip: ctx.request.ip(),
        userAgent: ctx.request.header('user-agent'),
        userId: ctx.auth?.user?.id,
        userEmail: ctx.auth?.user?.email,
        statusCode: ctx.response.getStatus(),
        duration,
      },
    })
  }

  /**
   * Log database query performance
   */
  logQuery(query: string, duration: number, context?: LogContext): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG

    this.log({
      message: 'Database Query',
      level,
      category: LogCategory.DATABASE,
      context: {
        ...context,
        duration,
      },
      metadata: {
        query: query.substring(0, 200),
      },
    })
  }

  /**
   * Log performance metric
   */
  logPerformance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO

    this.log({
      message: `Performance: ${operation}`,
      level,
      category: LogCategory.PERFORMANCE,
      context: {
        ...context,
        duration,
        operation,
      },
    })
  }

  /**
   * Log business event
   */
  logBusiness(event: string, context: LogContext, metadata?: Record<string, any>): void {
    this.info({
      message: `Business Event: ${event}`,
      category: LogCategory.BUSINESS,
      context,
      metadata,
    })
  }

  /**
   * Extract context from HTTP request
   */
  extractContext(ctx: HttpContext): LogContext {
    return {
      userId: ctx.auth?.user?.id,
      userEmail: ctx.auth?.user?.email,
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
      method: ctx.request.method(),
      url: ctx.request.url(),
    }
  }
}
