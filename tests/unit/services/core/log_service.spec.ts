import { test } from '@japa/runner'
import LogService, { LogLevel, LogCategory } from '#core/services/log_service'
import { UserFactory } from '#tests/helpers/factories'
import logger from '@adonisjs/core/services/logger'
import sinon from 'sinon'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

test.group('LogService', (group) => {
  let logService: LogService
  let loggerDebugSpy: sinon.SinonSpy
  let loggerInfoSpy: sinon.SinonSpy
  let loggerWarnSpy: sinon.SinonSpy
  let loggerErrorSpy: sinon.SinonSpy
  let loggerFatalSpy: sinon.SinonSpy

  group.setup(async () => {
    logService = await app.container.make(LogService)
    loggerDebugSpy = sinon.spy(logger, 'debug')
    loggerInfoSpy = sinon.spy(logger, 'info')
    loggerWarnSpy = sinon.spy(logger, 'warn')
    loggerErrorSpy = sinon.spy(logger, 'error')
    loggerFatalSpy = sinon.spy(logger, 'fatal')
  })

  group.teardown(() => {
    loggerDebugSpy.restore()
    loggerInfoSpy.restore()
    loggerWarnSpy.restore()
    loggerErrorSpy.restore()
    loggerFatalSpy.restore()
  })

  group.each.teardown(() => {
    loggerDebugSpy.resetHistory()
    loggerInfoSpy.resetHistory()
    loggerWarnSpy.resetHistory()
    loggerErrorSpy.resetHistory()
    loggerFatalSpy.resetHistory()
  })

  test('debug: should log debug message', ({ assert }) => {
    logService.debug({
      message: 'Debug message',
      category: LogCategory.SYSTEM,
    })

    assert.isTrue(loggerDebugSpy.calledOnce)
    const logData = loggerDebugSpy.getCall(0).args[0]
    assert.equal(logData.message, 'Debug message')
    assert.equal(logData.category, LogCategory.SYSTEM)
  })

  test('info: should log info message', ({ assert }) => {
    logService.info({
      message: 'Info message',
      category: LogCategory.API,
    })

    assert.isTrue(loggerInfoSpy.calledOnce)
    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.message, 'Info message')
    assert.equal(logData.category, LogCategory.API)
  })

  test('warn: should log warning message', ({ assert }) => {
    logService.warn({
      message: 'Warning message',
      category: LogCategory.SECURITY,
    })

    assert.isTrue(loggerWarnSpy.calledOnce)
    const logData = loggerWarnSpy.getCall(0).args[0]
    assert.equal(logData.message, 'Warning message')
    assert.equal(logData.category, LogCategory.SECURITY)
  })

  test('error: should log error message', ({ assert }) => {
    logService.error({
      message: 'Error message',
      category: LogCategory.DATABASE,
    })

    assert.isTrue(loggerErrorSpy.calledOnce)
    const logData = loggerErrorSpy.getCall(0).args[0]
    assert.equal(logData.message, 'Error message')
    assert.equal(logData.category, LogCategory.DATABASE)
  })

  test('fatal: should log fatal message', ({ assert }) => {
    logService.fatal({
      message: 'Fatal message',
      category: LogCategory.SYSTEM,
    })

    assert.isTrue(loggerFatalSpy.calledOnce)
    const logData = loggerFatalSpy.getCall(0).args[0]
    assert.equal(logData.message, 'Fatal message')
    assert.equal(logData.category, LogCategory.SYSTEM)
  })

  test('log: should include timestamp', ({ assert }) => {
    logService.info({
      message: 'Test message',
    })

    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.exists(logData.timestamp)
    assert.match(logData.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  test('log: should include context data', ({ assert }) => {
    logService.info({
      message: 'Test message',
      context: {
        userId: 123,
        userEmail: 'test@example.com',
        ip: '192.168.1.1',
      },
    })

    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.userId, 123)
    assert.equal(logData.userEmail, 'test@example.com')
    assert.equal(logData.ip, '192.168.1.1')
  })

  test('log: should include metadata', ({ assert }) => {
    logService.info({
      message: 'Test message',
      metadata: {
        custom: 'data',
        requestId: 'abc-123',
      },
    })

    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.custom, 'data')
    assert.equal(logData.requestId, 'abc-123')
  })

  test('log: should include error details', ({ assert }) => {
    const error = new Error('Test error')

    logService.error({
      message: 'Error occurred',
      error,
    })

    const logData = loggerErrorSpy.getCall(0).args[0]
    assert.exists(logData.error)
    assert.equal(logData.error.name, 'Error')
    assert.equal(logData.error.message, 'Test error')
    assert.exists(logData.error.stack)
  })

  test('log: should use default level INFO', ({ assert }) => {
    logService.log({
      message: 'Default level message',
    })

    assert.isTrue(loggerInfoSpy.calledOnce)
  })

  test('log: should use default category SYSTEM', ({ assert }) => {
    logService.info({
      message: 'Default category message',
    })

    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.category, LogCategory.SYSTEM)
  })

  test('logAuth: should log authentication event', ({ assert }) => {
    logService.logAuth('login', {
      userId: 123,
      userEmail: 'test@example.com',
      ip: '192.168.1.1',
    })

    assert.isTrue(loggerInfoSpy.calledOnce)
    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.message, 'Authentication: login')
    assert.equal(logData.category, LogCategory.AUTH)
    assert.equal(logData.userId, 123)
  })

  test('logSecurity: should log security event with default WARN level', ({ assert }) => {
    logService.logSecurity('Suspicious activity detected', {
      ip: '192.168.1.1',
      userAgent: 'suspicious-agent',
    })

    assert.isTrue(loggerWarnSpy.calledOnce)
    const logData = loggerWarnSpy.getCall(0).args[0]
    assert.equal(logData.category, LogCategory.SECURITY)
  })

  test('logSecurity: should accept custom log level', ({ assert }) => {
    logService.logSecurity(
      'Critical security breach',
      {
        ip: '192.168.1.1',
      },
      LogLevel.ERROR
    )

    assert.isTrue(loggerErrorSpy.calledOnce)
  })

  test('logApiRequest: should log API request details', async ({ assert }) => {
    const user = await UserFactory.create()
    const ctx = createMockContext({
      user,
      method: 'POST',
      url: '/api/users',
      statusCode: 201,
      ip: '192.168.1.1',
      userAgent: 'test-agent',
    })

    logService.logApiRequest(ctx, 150)

    assert.isTrue(loggerInfoSpy.calledOnce)
    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.message, 'API Request')
    assert.equal(logData.category, LogCategory.API)
    assert.equal(logData.method, 'POST')
    assert.equal(logData.url, '/api/users')
    assert.equal(logData.statusCode, 201)
    assert.equal(logData.duration, 150)
    assert.equal(logData.userId, user.id)
  })

  test('logApiRequest: should handle unauthenticated requests', ({ assert }) => {
    const ctx = createMockContext({ user: null })

    logService.logApiRequest(ctx, 100)

    assert.isTrue(loggerInfoSpy.calledOnce)
    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.isUndefined(logData.userId)
    assert.isUndefined(logData.userEmail)
  })

  test('logApiRequest: should handle missing duration', ({ assert }) => {
    const ctx = createMockContext()

    logService.logApiRequest(ctx)

    assert.isTrue(loggerInfoSpy.calledOnce)
    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.isUndefined(logData.duration)
  })

  test('logQuery: should log fast queries as DEBUG', ({ assert }) => {
    logService.logQuery('SELECT * FROM users', 500)

    assert.isTrue(loggerDebugSpy.calledOnce)
    const logData = loggerDebugSpy.getCall(0).args[0]
    assert.equal(logData.category, LogCategory.DATABASE)
    assert.equal(logData.duration, 500)
  })

  test('logQuery: should log slow queries as WARN', ({ assert }) => {
    logService.logQuery('SELECT * FROM large_table', 1500)

    assert.isTrue(loggerWarnSpy.calledOnce)
    const logData = loggerWarnSpy.getCall(0).args[0]
    assert.equal(logData.duration, 1500)
  })

  test('logQuery: should truncate long queries', ({ assert }) => {
    const longQuery = 'SELECT * FROM users WHERE ' + 'x'.repeat(300)

    logService.logQuery(longQuery, 100)

    const logData = loggerDebugSpy.getCall(0).args[0]
    assert.equal(logData.query.length, 200)
  })

  test('logQuery: should include context', ({ assert }) => {
    logService.logQuery('SELECT * FROM users', 100, {
      userId: 123,
      operation: 'fetch_users',
    })

    const logData = loggerDebugSpy.getCall(0).args[0]
    assert.equal(logData.userId, 123)
    assert.equal(logData.operation, 'fetch_users')
  })

  test('logPerformance: should log fast operations as INFO', ({ assert }) => {
    logService.logPerformance('Process payment', 3000)

    assert.isTrue(loggerInfoSpy.calledOnce)
    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.message, 'Performance: Process payment')
    assert.equal(logData.category, LogCategory.PERFORMANCE)
    assert.equal(logData.duration, 3000)
    assert.equal(logData.operation, 'Process payment')
  })

  test('logPerformance: should log slow operations as WARN', ({ assert }) => {
    logService.logPerformance('Heavy computation', 6000)

    assert.isTrue(loggerWarnSpy.calledOnce)
    const logData = loggerWarnSpy.getCall(0).args[0]
    assert.equal(logData.duration, 6000)
  })

  test('logPerformance: should include context', ({ assert }) => {
    logService.logPerformance('Upload file', 2000, {
      fileSize: 5000000,
      userId: 123,
    })

    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.fileSize, 5000000)
    assert.equal(logData.userId, 123)
  })

  test('logBusiness: should log business event', ({ assert }) => {
    logService.logBusiness(
      'Order completed',
      {
        userId: 123,
        orderValue: 99.99,
      },
      {
        orderId: 'ORD-123',
        items: 5,
      }
    )

    assert.isTrue(loggerInfoSpy.calledOnce)
    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.message, 'Business Event: Order completed')
    assert.equal(logData.category, LogCategory.BUSINESS)
    assert.equal(logData.userId, 123)
    assert.equal(logData.orderValue, 99.99)
    assert.equal(logData.orderId, 'ORD-123')
    assert.equal(logData.items, 5)
  })

  test('extractContext: should extract context from HTTP request', async ({ assert }) => {
    const user = await UserFactory.create()
    const ctx = createMockContext({
      user,
      method: 'GET',
      url: '/api/users',
      ip: '192.168.1.1',
      userAgent: 'test-agent',
    })

    const context = logService.extractContext(ctx)

    assert.equal(context.userId, user.id)
    assert.equal(context.userEmail, user.email)
    assert.equal(context.ip, '192.168.1.1')
    assert.equal(context.userAgent, 'test-agent')
    assert.equal(context.method, 'GET')
    assert.equal(context.url, '/api/users')
  })

  test('extractContext: should handle unauthenticated requests', ({ assert }) => {
    const ctx = createMockContext({ user: null })

    const context = logService.extractContext(ctx)

    assert.isUndefined(context.userId)
    assert.isUndefined(context.userEmail)
    assert.exists(context.ip)
    assert.exists(context.method)
    assert.exists(context.url)
  })

  test('edge case: should handle null context', ({ assert }) => {
    logService.info({
      message: 'Test message',
      context: undefined,
    })

    assert.isTrue(loggerInfoSpy.calledOnce)
    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.message, 'Test message')
  })

  test('edge case: should handle empty metadata', ({ assert }) => {
    logService.info({
      message: 'Test message',
      metadata: {},
    })

    assert.isTrue(loggerInfoSpy.calledOnce)
  })

  test('consistency: all log levels should include timestamp', ({ assert }) => {
    logService.debug({ message: 'Debug' })
    logService.info({ message: 'Info' })
    logService.warn({ message: 'Warn' })
    logService.error({ message: 'Error' })
    logService.fatal({ message: 'Fatal' })

    assert.exists(loggerDebugSpy.getCall(0).args[0].timestamp)
    assert.exists(loggerInfoSpy.getCall(0).args[0].timestamp)
    assert.exists(loggerWarnSpy.getCall(0).args[0].timestamp)
    assert.exists(loggerErrorSpy.getCall(0).args[0].timestamp)
    assert.exists(loggerFatalSpy.getCall(0).args[0].timestamp)
  })

  test('real-world: complete API request logging flow', async ({ assert }) => {
    const user = await UserFactory.create()
    const ctx = createMockContext({
      user,
      method: 'POST',
      url: '/api/users',
      statusCode: 201,
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    })

    logService.logApiRequest(ctx, 150)

    assert.isTrue(loggerInfoSpy.calledOnce)
    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.message, 'API Request')
    assert.equal(logData.category, LogCategory.API)
    assert.equal(logData.method, 'POST')
    assert.equal(logData.statusCode, 201)
    assert.equal(logData.duration, 150)
    assert.exists(logData.timestamp)
  })

  test('real-world: security incident logging', ({ assert }) => {
    logService.logSecurity(
      'Multiple failed login attempts',
      {
        ip: '192.168.1.100',
        userEmail: 'attacker@example.com',
        attempts: 5,
      },
      LogLevel.ERROR
    )

    assert.isTrue(loggerErrorSpy.calledOnce)
    const logData = loggerErrorSpy.getCall(0).args[0]
    assert.equal(logData.category, LogCategory.SECURITY)
    assert.equal(logData.attempts, 5)
  })

  test('real-world: business metrics logging', ({ assert }) => {
    logService.logBusiness(
      'Subscription purchased',
      {
        userId: 123,
        subscriptionPlan: 'premium',
      },
      {
        revenue: 29.99,
        currency: 'USD',
        period: 'monthly',
      }
    )

    assert.isTrue(loggerInfoSpy.calledOnce)
    const logData = loggerInfoSpy.getCall(0).args[0]
    assert.equal(logData.category, LogCategory.BUSINESS)
    assert.equal(logData.revenue, 29.99)
    assert.equal(logData.subscriptionPlan, 'premium')
  })
})

interface MockContextOptions {
  user?: any
  method?: string
  url?: string
  statusCode?: number
  ip?: string
  userAgent?: string
}

const createMockContext = (options: MockContextOptions = {}): HttpContext => {
  const {
    user = null,
    method = 'GET',
    url = '/test',
    statusCode = 200,
    ip = '127.0.0.1',
    userAgent = 'test-agent',
  } = options

  return {
    auth: {
      user,
    },
    request: {
      method: () => method,
      url: () => url,
      ip: () => ip,
      header: sinon.stub().withArgs('user-agent').returns(userAgent),
    },
    response: {
      getStatus: () => statusCode,
    },
  } as any
}
