# 📝 Existing Code Signatures

This file contains the signatures (public interfaces) of all important files in the boilerplate.
**Do not copy the complete code, just the signatures to avoid duplication.**

---

## 🔐 AUTH - Controllers

### app/auth/controllers/login_controller.ts
```typescript
export default class LoginController {
  render({ inertia }: HttpContext)
  async execute({ auth, request, response, session }: HttpContext)
}
```

### app/auth/controllers/register_controller.ts
```typescript
export default class RegisterController {
  static validator = vine.compile(...)
  render({ inertia }: HttpContext)
  async execute({ auth, request, response }: HttpContext)
}
```

### app/auth/controllers/logout_controller.ts
```typescript
export default class LogoutController {
  async execute({ auth, response }: HttpContext)
}
```

### app/auth/controllers/forgot_password_controller.ts
```typescript
@inject()
export default class ForgotPasswordController {
  constructor(protected passwordService: PasswordService)
  render({ inertia }: HttpContext)
  async execute({ request, response, session }: HttpContext)
}
```

### app/auth/controllers/reset_password_controller.ts
```typescript
export default class ResetPasswordController {
  static validator = vine.compile(...)
  async render({ inertia, params, session, response }: HttpContext)
  async execute({ request, response, session, auth }: HttpContext)
}
```

### app/auth/controllers/social_controller.ts
```typescript
type OAuthProvider = 'github' | 'google' | 'facebook'

@inject()
export default class SocialController {
  constructor(protected socialService: SocialService)
  
  static definePasswordValidator = vine.compile(...)
  
  protected validateProvider(provider: string, session: any, response: any)
  async redirect({ ally, params, session, response }: HttpContext)
  async callback({ ally, params, auth, response, session }: HttpContext)
  async unlink({ auth, params, response, session }: HttpContext)
  render({ inertia }: HttpContext)
  async execute({ auth, request, response, session }: HttpContext)
}
```

---

## 🔐 AUTH - Services

### app/auth/services/password_service.ts
```typescript
export default class PasswordService {
  async sendResetPasswordLink(user: User): Promise
  // Now uses:
  // - i18nManager to detect user's locale (user.locale || 'en')
  // - Edge template (resources/views/emails/reset_password.edge)
  // - Translations from resources/lang/{locale}/emails.json
  // - Generates random(64) token, expires old tokens
  // - Creates new token with 1h expiration
  // - Builds reset link and sends multilingual email
}
```

### app/auth/services/social_service.ts
```typescript
export default class SocialService {
  async findOrCreateUser(
    allyUser: AllyUserContract<any>,
    provider: 'github' | 'google' | 'facebook'
  ): Promise<User>
  // Search by provider ID → by email → create if non-existent
  
  async linkProvider(
    user: User,
    allyUser: AllyUserContract<any>,
    provider: 'github' | 'google' | 'facebook'
  ): Promise<void>
  // Checks not already linked elsewhere, links provider to user
  
  async unlinkProvider(
    user: User,
    provider: 'github' | 'google' | 'facebook'
  ): Promise<void>
  // Sets provider ID to null
  
  needsPasswordSetup(user: User): boolean
  // Returns true if user has OAuth but no password
}
```

---

## 🔐 AUTH - Models

### app/auth/models/user.ts
```typescript
const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
  
  @column({ isPrimary: true })
  declare id: number
  
  @column()
  declare fullName: string | null
  
  @column()
  declare email: string
  
  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare locale: string | null
  
  @column()
  declare githubId: string | null
  
  @column()
  declare googleId: string | null
  
  @column()
  declare facebookId: string | null
  
  @hasMany(() => Token)
  declare public tokens: HasMany<typeof Token>
  
  @hasMany(() => Token, { onQuery: (query) => query.where('type', 'PASSWORD_RESET') })
  declare public passwordResetTokens: HasMany<typeof Token>
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
```

---

## 🔐 AUTH - Presenters

### app/auth/presenters/user_presenter.ts
```typescript
export interface UserPresenterData {
  id: number
  email: string
  fullName: string | null
  locale: string | null  // NEW
  githubId: string | null
  googleId: string | null
  facebookId: string | null
  createdAt: string
  updatedAt: string | null
}

export class UserPresenter {
  static toJSON(user: User | undefined | null): UserPresenterData | null
  // Returns all user data including locale (for owner/admin)

  static toPublicJSON(user: User | undefined | null)
  // Returns id, email, fullName, locale, dates (no OAuth IDs)
  // locale is public as it's just a preference

  static hasLinkedProviders(user: User): boolean
  // Returns true if at least one OAuth provider linked

  static getLinkedProviders(user: User): { github: boolean, google: boolean, facebook: boolean }
  // Returns object with each provider's state
}
```

---

## 🔐 AUTH - Helpers

### app/auth/helpers/oauth.ts
```typescript
export type OAuthProviderName = 'github' | 'google' | 'facebook'

export interface OAuthProviderConfig {
  name: string
  icon: string  // SVG path
  color: string
  enabled: boolean
}

export const OAUTH_PROVIDERS: Record<OAuthProviderName, OAuthProviderConfig>
// Object containing GitHub, Google, Facebook config with SVG icons

export function getEnabledProviders(): OAuthProviderConfig[]
// Returns list of enabled providers (according to env config)

export function isProviderActive(provider: OAuthProviderName): boolean
// Checks if a provider is enabled

export function getProviderConfig(provider: OAuthProviderName): OAuthProviderConfig | null
// Returns a provider's config
```

---

## 🗃️ CORE - Services

### app/core/services/cache_service.ts
```typescript
export default class CacheService {
  async get(key: string): Promise
  async set(key: string, value: any, ttlSeconds?: number): Promise
  async delete(key: string): Promise
  async has(key: string): Promise
  async flush(): Promise
  async increment(key: string, value: number, ttlSeconds?: number): Promise
  async decrement(key: string, value: number, ttlSeconds?: number): Promise
  async getMany(keys: string[]): Promise<Map>
  async setMany(entries: Map, ttlSeconds?: number): Promise
  // Uses Redis if available, falls back to Memory cache
}
```

### app/core/services/rate_limit_service.ts
```typescript
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: DateTime
  retryAfter?: number
}

export default class RateLimitService {
  async attempt(key: string, maxAttempts: number, decaySeconds: number): Promise
  // Checks if request is allowed, uses Redis if available, falls back to Database
  
  async reset(key: string): Promise
  // Resets rate limit for a key
  
  async remaining(key: string, maxAttempts: number): Promise
  // Gets remaining attempts
  
  async clear(): Promise
  // Clears all rate limits (useful for tests)
}
```

---

## 🗃️ CORE - Models

### app/core/models/rate_limit.ts
```typescript
export default class RateLimit extends BaseModel {
  @column({ isPrimary: true })
  declare id: number
  
  @column()
  declare key: string
  
  @column()
  declare hits: number
  
  @column.dateTime()
  declare resetAt: DateTime
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
  
  static async cleanExpired(): Promise
  // Deletes expired rate limit entries
}
```

---

## 🗃️ CORE - Helpers

### app/core/helpers/redis.ts
```typescript
export async function isRedisAvailable(): Promise
// Checks if Redis is available and connected (cached result)

export async function getRedisConnection()
// Returns Redis connection if available, throws error otherwise

export function resetRedisCheck()
// Resets availability check (useful for tests)
```

---

## 🗃️ CORE - Exceptions

### app/core/exceptions/too_many_requests_exception.ts
```typescript
export default class TooManyRequestsException extends Exception {
  static status = 429
  static code = 'E_TOO_MANY_REQUESTS'
  
  constructor(message: string, public retryAfter?: number)
  // Custom exception for rate limiting
  // Includes Retry-After header support
  // Handles both Inertia (redirect) and API (JSON) responses
  
  async handle(error: this, ctx: HttpContext)
  // For Inertia: Redirects back with flash error
  // For API: Returns 429 JSON with retryAfter
}
```

### app/core/exceptions/handler.ts
```typescript
export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction
  
  protected statusPages: Record = {
    '404': (error, { inertia }) => inertia.render('errors/not_found', { error }),
    '429': (error, { inertia }) => inertia.render('errors/too_many_requests', { error }),
    '500..599': (error, { inertia }) => inertia.render('errors/server_error', { error }),
  }
  
  async handle(error: unknown, ctx: HttpContext)
  async report(error: unknown, ctx: HttpContext)
}
```

---

## 👤 PROFILE - Controllers

### app/profile/controllers/profile_show_controller.ts
```typescript
export default class ProfileShowController {
  async render({ auth, inertia }: HttpContext)
  // Returns profile page with notifications, providers, linkedProviders
}
```

### app/profile/controllers/profile_update_controller.ts
```typescript
export default class ProfileUpdateController {
  async execute({ auth, request, response, session, i18n }: HttpContext)
  // Dynamic validator with exceptId and locale validation
  // Updates fullName, email, AND locale (NEW)
  // If locale changes, triggers page reload on frontend
  
  // Validator includes:
  // - fullName: optional, min 2, max 255
  // - email: required, unique (except current user)
  // - locale: required, enum(['en', 'fr'])  // NEW
}
```

### app/profile/controllers/profile_update_password_controller.ts
```typescript
export default class ProfileUpdatePasswordController {
  static validator = vine.compile(...)
  
  async execute({ auth, request, response, session }: HttpContext)
  // Verifies current_password, updates password
}
```

### app/profile/controllers/profile_delete_controller.ts
```typescript
export default class ProfileDeleteController {
  static validator = vine.compile(...)
  
  async execute({ auth, request, response, session }: HttpContext)
  // Verifies password, logout, deletes user
}
```

### app/profile/controllers/profile_clean_notifications_controller.ts
```typescript
export default class ProfileCleanNotificationsController {
  async execute({ auth, response, session }: HttpContext)
  // TODO: Delete notifications (not implemented)
}
```

---

## 🗃️ CORE - Models

### app/core/models/token.ts
```typescript
export default class Token extends BaseModel {
  @column({ isPrimary: true })
  declare id: number
  
  @column()
  declare public userId: number | null
  
  @column()
  declare public type: string  // 'PASSWORD_RESET', etc.
  
  @column()
  declare public token: string
  
  @column.dateTime()
  declare expiresAt: DateTime | null
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
  
  @belongsTo(() => User)
  declare public user: BelongsTo<typeof User>
  
  // Static methods
  public static async expirePasswordResetTokens(user: User): Promise<void>
  // Sets expiresAt to now for all user's PASSWORD_RESET tokens
  
  public static async getPasswordResetUser(token: string): Promise<User | undefined>
  // Returns user associated with valid token
  
  public static async verify(token: string): Promise<boolean>
  // Verifies if token exists and is not expired
}
```

---

## 🗃️ CORE - Middleware

### app/core/middleware/auth_middleware.ts
```typescript
export default class AuthMiddleware {
  redirectTo = '/login'
  
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { guards?: (keyof Authenticators)[] } = {}
  )
  // Authenticates or redirects to /login
}
```

### app/core/middleware/guest_middleware.ts
```typescript
export default class GuestMiddleware {
  redirectTo = '/'
  
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { guards?: (keyof Authenticators)[] } = {}
  )
  // Redirects to / if already authenticated
}
```

### app/core/middleware/silent_auth_middleware.ts
```typescript
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn)
  // Checks auth without blocking (to have currentUser everywhere)
}
```

### app/core/middleware/container_bindings_middleware.ts
```typescript
export default class ContainerBindingsMiddleware {
  handle(ctx: HttpContext, next: NextFn)
  // Binds HttpContext and Logger for DI
}
```

### app/core/middleware/detect_user_locale_middleware.ts
```typescript
import { I18n } from '@adonisjs/i18n'
import i18nManager from '@adonisjs/i18n/services/main'
import type { NextFn } from '@adonisjs/core/types/http'
import { type HttpContext, RequestValidator } from '@adonisjs/core/http'

export default class DetectUserLocaleMiddleware {
  static {
    RequestValidator.messagesProvider = (ctx) => {
      return ctx.i18n.createMessagesProvider()
    }
  }

  protected getRequestLocale(ctx: HttpContext): string
  // Detects user locale with priority:
  // 1. ctx.auth.user?.locale (if authenticated)
  // 2. Accept-Language header (via i18nManager.getSupportedLocaleFor)
  // 3. Default locale (via i18nManager.defaultLocale)

  async handle(ctx: HttpContext, next: NextFn)
  // Sets ctx.i18n, binds I18n to container, shares with Edge
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    i18n: I18n
  }
}
```

### app/core/middleware/throttle_middleware.ts
```typescript
export interface ThrottleOptions {
  max: number                                 // Maximum requests allowed
  window: number                              // Time window in seconds
  keyGenerator?: (ctx: HttpContext) => string // Custom key generator
}

@inject()
export default class ThrottleMiddleware {
  constructor(protected rateLimitService: RateLimitService)
  
  async handle(ctx: HttpContext, next: NextFn, options?: ThrottleOptions)
  // Checks rate limit using RateLimitService
  // For Inertia requests: Redirects back with flash error
  // For API requests: Throws TooManyRequestsException
  // Adds rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  // Logs rate limit violations
  
  private generateKey(ctx: HttpContext): string
  // Generates rate limit key: "throttle:{route}:{ip}"
}
```

---

## 🗃️ CORE - Helpers

### app/core/helpers/validator.ts
```typescript
export type DatabaseOptions = {
  caseInsensitive?: boolean
  exceptId?: number
}

export async function query(
  db: Database,
  table: string,
  column: string,
  value: string,
  options?: DatabaseOptions
): Promise<any[]>
// Reusable query builder

export function exists(table: string, column: string, options?: DatabaseOptions)
// VineJS validator to check existence in DB

export function unique(table: string, column: string, options?: DatabaseOptions)
// VineJS validator to check uniqueness in DB (with exceptId for updates)
```

### app/core/helpers/sleep.ts
```typescript
export function sleep(time: number): Promise<void>
// Promise that resolves after time ms
```

---

## 🗃️ CORE - Exception Handler

### app/core/exceptions/handler.ts
```typescript
export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction
  
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (error, { inertia }) => inertia.render('errors/not_found', { error }),
    '500..599': (error, { inertia }) => inertia.render('errors/server_error', { error }),
  }
  
  async handle(error: unknown, ctx: HttpContext)
  async report(error: unknown, ctx: HttpContext)
}
```

---

## ⚙️ COMMANDS

### commands/create_user.ts
```typescript
export default class CreateUser extends BaseCommand {
  static commandName = 'create:user'
  static description = 'Create a new user'
  static options: CommandOptions = { startApp: true }
  
  @args.string()
  declare email: string
  
  async run()
  // Creates user with email and password "password"
}
```

### commands/cleanup_rate_limits.ts
```typescript
export default class CleanupRateLimits extends BaseCommand {
  static commandName = 'cleanup:rate-limits'
  static description = 'Clean expired rate limit entries from database'

  async run()
  // Calls RateLimit.cleanExpired()
}

---

## ⚛️ REACT - Entry Points

### inertia/app/app.tsx (Client-side)
```typescript
void createInertiaApp({
  progress: { color: '#5468FF' },
  title: (title) => `${title} - ${appName}`,
  
  async resolve(name) {
    const page = await resolvePageComponent(...)
    page.default.layout = page.default.layout || ((page) => <AppShell children={page} />)
    return page
  },
  
  setup({ el, App, props }) {
    // Set i18n locale from page props (NEW)
    const locale = String(props.initialPage.props.locale || 'en')
    i18n.changeLanguage(locale)
    
    const applicationTree = <App {...props} />
    hydrateRoot(el, applicationTree)
  },
})
```

### inertia/app/ssr.tsx (Server-side)
```typescript
export default function render(page: any) {
  return createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    
    resolve: (name) => {
      const pages = import.meta.glob('../pages/**/*.tsx', { eager: true })
      const pageModule = pages[`../pages/${name}.tsx`]
      if (pageModule.default.layout === undefined) {
        pageModule.default.layout = (page) => <AppShell children={page} />
      }
      return pageModule
    },
    
    setup: ({ App, props }) => {
      // Set i18n locale from page props for SSR (NEW)
      const locale = String(page.props.locale || 'en')
      i18n.changeLanguage(locale)
      
      return <App {...props} />
    },
  })
}
```

---

## ⚛️ REACT - Components / Elements

### inertia/components/elements/button.tsx
```typescript
interface ButtonProps {
  loading?: boolean
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "accent" | "danger" | "success" | "outline" | "transparent" | "social"
  disabled?: boolean
  children: ReactNode
  onClick?: () => void
  fitContent?: boolean
  href?: string
  external?: boolean
}

export function Button(props: ButtonProps)
// Universal button with variants, loading, Inertia Link and <a> support
```

### inertia/components/elements/nav_link.tsx
```typescript
interface NavLinkProps {
  href: string
  label: string
  method?: 'get' | 'post' | 'patch' | 'put' | 'delete'
  fs?: number
  color?: string
  hover_color?: string
  current_page_color?: string
  children?: ReactNode
  onClick?: () => void
}

export function NavLink(props: NavLinkProps)
// Inertia Link with active page detection (aria-current)
```

### inertia/components/elements/panel.tsx
```typescript
interface PanelProps {
  children: ReactNode
  title?: string
  subtitle?: string
  variant?: "default" | "bordered" | "flat" | "elevated"
  padding?: "none" | "sm" | "md" | "lg"
  header?: ReactNode
  footer?: ReactNode
}

export function Panel(props: PanelProps)
// Container with optional header/footer, separators
```

### inertia/components/elements/flash_messages.tsx
```typescript
interface FlashProps {
  success?: string
  error?: string
  warning?: string
  info?: string
}

export function FlashMessages()
// Auto-dismiss toasts 5s, entrance/exit animations, progress bar
// Reads flash from usePage().props
```

---

## ⚛️ REACT - Components / Forms

### inertia/components/forms/input.tsx
```typescript
interface InputProps {
  name: string
  type: string  // text, email, password, textarea, select, checkbox, radio, file
  placeholder?: string
  value?: string | number
  checked?: boolean
  options?: Array<{ value: string; label: string }>
  cols?: number
  rows?: number
  disabled?: boolean
  required?: boolean
  onChange?: (event: ChangeEvent<...>) => void
}

export function Input(props: InputProps)
// Universal input, switches by type, differentiated styles
```

### inertia/components/forms/label.tsx
```typescript
interface LabelProps {
  label: string
  htmlFor: string
  required?: boolean
}

export function Label(props: LabelProps)
// Label with red asterisk if required
```

### inertia/components/forms/input_group.tsx
```typescript
interface InputGroupProps {
  label: string
  name: string
  type: string
  // ... all Input props
  errorMessage?: string
  helpText?: string
  helpClassName?: string
}

export function InputGroup(props: InputGroupProps)
// Label + Input + Error + HelpText, inline layout for checkbox/radio
```

---

## ⚛️ REACT - Components / Layouts

### inertia/components/layouts/app_shell.tsx
```typescript
interface AppShellProps {
  children: ReactNode
}

export default function AppShell(props: AppShellProps)
// Main layout: PageHeader + FlashMessages + children
```

### inertia/components/layouts/page_header.tsx
```typescript
export function PageHeader()
// Responsive header with logo, nav (Home, About, Contact),
// burger menu mobile, auto-close after navigation,
// displays "Hello {name}" if logged in
```

---

## ⚛️ REACT - Helpers

### inertia/helpers/oauth.ts
```typescript
export function getProviderRoute(providerName: string): string
// Returns `/oauth/${providerName.toLowerCase()}`
```

---

## ⚛️ REACT - Types

### inertia/types/oauth.ts
```typescript
export interface OAuthProvider {
  name: string
  icon: string
  color: string
  enabled: boolean
}
```

---

## ⚙️ CONFIGURATION

### config/auth.ts
```typescript
const authConfig = defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      useRememberMeTokens: true,
      provider: sessionUserProvider({
        model: () => import('#auth/models/user'),
      }),
    }),
  },
})
```

### config/ally.ts
```typescript
const allyConfig = defineConfig({
  github: services.github({ clientId, clientSecret, callbackUrl }),
  google: services.google({ clientId, clientSecret, callbackUrl }),
  facebook: services.facebook({ clientId, clientSecret, callbackUrl }),
})

function isProviderConfigured(clientId?: string, clientSecret?: string): boolean
// Checks if client ID/secret are present and !== "dummy"

export const enabledProviders: Array<'github' | 'google' | 'facebook'>
// List of enabled providers (filtered by env config)

export function isProviderEnabled(provider: string): boolean
```

### config/database.ts
```typescript
const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: { host, port, user, password, database },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})
```

### config/inertia.ts
```typescript
const inertiaConfig = defineConfig({
  rootView: 'inertia_layout',

  sharedData: {
    currentUser: (ctx) => UserPresenter.toPublicJSON(ctx.auth?.user),
    locale: (ctx) => ctx.i18n?.locale || ctx.auth?.user?.locale || 'en',
    errors: (ctx) => ctx.session?.flashMessages.get('errors'),
    flash: (ctx) => ({
      success: ctx.session?.flashMessages.get('success'),
      error: ctx.session?.flashMessages.get('error'),
      warning: ctx.session?.flashMessages.get('warning'),
      info: ctx.session?.flashMessages.get('info'),
    }),
  },

  ssr: {
    enabled: true,
    entrypoint: 'inertia/app/ssr.tsx',
  },
})
```

### config/mail.ts
```typescript
const mailConfig = defineConfig({
  default: 'smtp',
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      // auth: { type: 'login', user, pass } (commented)
    }),
  },
})
```

### config/redis.ts
```typescript
const redisConfig = defineConfig({
  connection: env.get('REDIS_ENABLED') ? 'main' : 'local',
  connections: {
    main: {
      host, port, password, db: 0,
      retryStrategy: (times) => times > 3 ? null : Math.min(times * 50, 2000),
      lazyConnect: true,
    },
    local: { /* fallback config */ },
  },
})
```

### config/shield.ts
```typescript
const shieldConfig = defineConfig({
  csp: { enabled: false },
  csrf: {
    enabled: true,
    exceptRoutes: [],
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },
  xFrame: { enabled: true, action: 'DENY' },
  hsts: { enabled: true, maxAge: '180 days' },
  contentTypeSniffing: { enabled: true },
})
```

### config/hash.ts
```typescript
const hashConfig = defineConfig({
  default: 'scrypt',
  list: {
    scrypt: drivers.scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    }),
  },
})
```

### config/i18n.ts
```typescript
import { defineConfig } from '@adonisjs/i18n'

const i18nConfig = defineConfig({
  defaultLocale: 'en',
  supportedLocales: ['en', 'fr'],
  fallbackLocales: {
    'fr-*': 'fr',
    'en-*': 'en',
  },
  loaders: [
    () => import('@adonisjs/i18n/loaders/fs')({
      location: new URL('./resources/lang', import.meta.url),
    }),
  ],
})

export default i18nConfig

declare module '@adonisjs/i18n/types' {
  export interface I18nTranslations {}
}
```

### config/session.ts
```typescript
const sessionConfig = defineConfig({
  enabled: true,
  cookieName: 'adonis-session',
  clearWithBrowser: false,
  age: '2h',
  cookie: { path: '/', httpOnly: true, secure: app.inProduction, sameSite: 'lax' },
  store: env.get('SESSION_DRIVER'),  // 'cookie' or 'redis'
  stores: {
    cookie: stores.cookie(),
    redis: stores.redis({
      connection: 'main',
    }),
  },
})
```

---

## 🌐 TRANSLATIONS STRUCTURE

### Backend Translations (resources/lang/)
```
resources/lang/
├── en/
│   ├── auth.json           # Authentication messages
│   │   ├── login.*         # Login success/failed
│   │   ├── register.*      # Registration messages
│   │   ├── forgot_password.* # Password reset flow
│   │   ├── reset_password.*  # Token validation, success
│   │   └── social.*        # OAuth messages (linked, unlinked, etc.)
│   │
│   ├──errors.json         # Error messages (NEW)
│   │   ├── too_many_requests   # Rate limit error with {minutes} placeholder
│   │   └── rate_limit_exceeded # Generic rate limit message
│   │
│   ├── profile.json        # Profile management messages
│   │   ├── update.*        # Profile update success
│   │   ├── password.*      # Password change messages
│   │   ├── delete.*        # Account deletion
│   │   ├── notifications.* # Notifications cleared
│   │   └── locale.*        # Language preference updated (NEW)
│   │
│   └── emails.json         # Email content
│       └── reset_password.* # Subject, greeting, intro, action, outro, expiry, footer
│
└── fr/
    ├── auth.json
    ├── profile.json
    ├──errors.json 
    └── emails.json
```

**Usage in Backend:**
```typescript
// In controllers
session.flash('success', i18n.t('auth.login.success'))
session.flash('error', i18n.t('auth.social.linked', { provider: 'GitHub' }))

// In services (emails)
const subject = i18n.t('emails.reset_password.subject')
const greeting = i18n.t('emails.reset_password.greeting')
```

### Frontend Translations (inertia/locales/)
```
inertia/locales/
├── en/
│   ├── auth.json           # Auth pages translations
│   │   ├── login.*         # Title, subtitle, fields, buttons
│   │   ├── register.*      # Registration form
│   │   ├── forgot_password.* # Forgot password page
│   │   ├── reset_password.*  # Reset password page
│   │   └── define_password.* # OAuth password definition
│   │
│   ├── profile.json        # Profile page translations
│   │   └── sections.*      # profile_info, connected_accounts, update_password, delete_account
│   │
│   ├── common.json         # Common UI elements
│   │   ├── header.*        # Navigation, greeting, menu
│   │   ├── flash.*         # Toast close label
│   │   ├── select.*        # Default placeholder
│   │   └── language.*      # Language names (en, fr)
│   │
│   └── errors.json         # Error pages
│       ├── not_found.*     # 404 page
│       └── server_error.*  # 500 page
│
└── fr/
    ├── auth.json
    ├── profile.json
    ├── common.json
    └── errors.json
```

**Usage in Frontend:**
```typescript
// Single namespace
import { useTranslation } from 'react-i18next'

const { t } = useTranslation('auth')
<h1>{t('login.title')}</h1>  // "Welcome back!" or "Bon retour!"

// Multiple namespaces
const { t } = useTranslation('auth')
const { t: tCommon } = useTranslation('common')

<h1>{t('login.title')}</h1>
<span>{tCommon('header.home')}</span>
```

### Frontend Library Configuration (inertia/lib/i18n.ts)
```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Imports all translation files from inertia/locales/
// Configures namespaces: ['auth', 'profile', 'common', 'errors']
// Sets fallback locale: 'en'
// Initializes react-i18next

export default i18n
```

### Email Templates (resources/views/emails/)
```
resources/views/emails/
└── reset_password.edge     # Password reset email template
    ├── Uses inline SCSS for email client compatibility
    ├── Responsive design (max-width: 600px)
    ├── Gradient header (primary → accent)
    ├── Dynamic translations from resources/lang/{locale}/emails.json
    └── Variables: locale, appName, greeting, intro, action, outro, expiry, footer, resetLink
```

**Example usage in service:**
```typescript
await mail.send((message) => {
  message
    .to(user.email)
    .subject(i18n.t('emails.reset_password.subject'))
    .htmlView('emails/reset_password', {
      locale: user.locale || 'en',
      appName: Env.get('APP_NAME'),
      greeting: i18n.t('emails.reset_password.greeting'),
      intro: i18n.t('emails.reset_password.intro'),
      action: i18n.t('emails.reset_password.action'),
      outro: i18n.t('emails.reset_password.outro'),
      expiry: i18n.t('emails.reset_password.expiry', { hours: 1 }),
      footer: i18n.t('emails.reset_password.footer'),
      resetLink,
    })
})
```

---

## 🗄️ DATABASE - Migrations

### 1765907203210_create_users_table.ts
```typescript
async up() {
  this.schema.createTable('users', (table) => {
    table.increments('id').notNullable()
    table.string('full_name').nullable()
    table.string('email', 254).notNullable().unique()
    table.string('password').nullable()
    table.timestamp('created_at').notNullable()
    table.timestamp('updated_at').nullable()
  })
}
```

### 1765989606897_create_remember_me_tokens_table.ts
```typescript
async up() {
  this.schema.createTable('remember_me_tokens', (table) => {
    table.increments()
    table.integer('tokenable_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
    table.string('hash').notNullable().unique()
    table.timestamp('created_at').notNullable()
    table.timestamp('updated_at').notNullable()
    table.timestamp('expires_at').notNullable()
  })
}
```

### 1766017009920_create_tokens_table.ts
```typescript
async up() {
  this.schema.createTable('tokens', (table) => {
    table.increments('id')
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
    table.string('type').notNullable()
    table.string('token', 64).notNullable()
    table.timestamp('expires_at')
    table.timestamp('created_at')
    table.timestamp('updated_at')
  })
}
```

### 1766157032668_add_oauth_columns_to_users_table.ts
```typescript
async up() {
  this.schema.alterTable('users', (table) => {
    table.string('github_id').nullable().unique()
    table.string('google_id').nullable().unique()
    table.string('facebook_id').nullable().unique()
  })
}
```

### 1766268717077_add_locale_to_users_table.ts
```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('locale', 5).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('locale')
    })
  }
}
```

### 1766446092430_create_rate_limits_table.ts
```typescript
async up() {
  this.schema.createTable('rate_limits', (table) => {
    table.increments('id')
    table.string('key', 255).notNullable().unique()
    table.integer('hits').notNullable().defaultTo(0)
    table.timestamp('reset_at').notNullable()
    table.timestamp('created_at')
    table.timestamp('updated_at')
    table.index('reset_at')
  })
}
```

---

## 🎨 SCSS - Structure

### Abstracts
```scss
// abstracts/_colors.scss
$dark: (complete palette with neutral, primary, accent, all shades)
$light: (complete palette)
$color-neutral-{shade}: var(--neutral-{shade})

// abstracts/_typography.scss
$font-family-base: Atkinson-Hyperlegible
$font-sizes: (sm/lg breakpoints with 200-900)
$font-size-{shade}: var(--fs-{shade})

// abstracts/_sizes.scss
$sizes: (0-20, from 0rem to 20rem)
$size-{n}: value

// abstracts/_tokens.scss
$active-theme: $light
$color-text-default, $color-background-default, etc.
$box-shadow-{1-5}, $border-radius-{1-2}

// abstracts/_mixins.scss
@mixin mq($size)  // Media query helper
@mixin heading($fs, $color)  // Heading style generator
```

### Utilities (all responsive with breakpoints)
```scss
// Classes automatically generated for sm, md, lg
.clr-{color}-{shade}
.bg-{color}-{shade}
.margin-{size}, .padding-{size}, .gap-{size}
.fs-{300-900}, .fw-{bold|regular}
.display-{block|flex|grid|hidden}
.w-{full|fit|auto|10-100}, .h-{full|fit|auto}
.border-radius-{size}
// ... and many others
```

---

## 🚀 START

### start/env.ts
```typescript
export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test']),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  DOMAIN: Env.schema.string(),
  LOG_LEVEL: Env.schema.string(),
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory']),
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE,
  SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD,
  GITHUB_CLIENT_ID (optional), GITHUB_CLIENT_SECRET (optional), ...
  // OAuth variables optional
})
```

### start/kernel.ts
```typescript
server.errorHandler(() => import('#core/exceptions/handler'))

server.use([
  container_bindings,
  static_files,
  cors,
  vite,
  inertia,
])

router.use([
  bodyparser,
  session,
  shield,
  initialize_auth,
  silent_auth,
  detect_locale,
])

export const middleware = router.named({
  guest: () => import('#core/middleware/guest_middleware'),
  auth: () => import('#core/middleware/auth_middleware'),
  throttle: () => import('#core/middleware/throttle_middleware'),
})
```

### start/routes.ts
```typescript
// Structure:
router
  .group(() => {
    // Login
    router.get('/login', [LoginController, 'render']).as('auth.login')
    router
      .post('/login', [LoginController, 'execute'])
      .use(middleware.throttle({ max: 5, window: 900 }))  // 5 attempts / 15min

    // Register
    router.get('/register', [RegisterController, 'render']).as('auth.register')
    router
      .post('/register', [RegisterController, 'execute'])
      .use(middleware.throttle({ max: 3, window: 3600 }))  // 3 registrations / 1h

    // Forgot Password
    router
      .get('/forgot-password', [ForgotPasswordController, 'render'])
      .as('auth.forgot_password')
    router
      .post('/forgot-password', [ForgotPasswordController, 'execute'])
      .use(middleware.throttle({ max: 3, window: 3600 }))  // 3 requests / 1h

    // Reset Password
    router
      .get('/reset-password/:token', [ResetPasswordController, 'render'])
      .as('auth.reset_password')
    router
      .post('/reset-password', [ResetPasswordController, 'execute'])
      .use(middleware.throttle({ max: 3, window: 900 }))  // 3 attempts / 15min
  })
  .use(middleware.guest())

router.group(() => {
  // Authenticated routes (logout, define-password, unlink)
}).use(middleware.auth())

router.group(() => {
  // OAuth routes (redirect, callback)
}).prefix('oauth')

router.group(() => {
  // Profile routes (show, update, password, delete, notifications)
}).prefix('profile').use(middleware.auth())

router.on('/').renderInertia('landing').as('landing')
```

---

## 📝 Important Notes

### Injectable Services
- PasswordService
- SocialService
- (Future: NotificationService, CacheService, etc.)

### Reusable Validators
- `unique(table, column, options)` with exceptId
- `exists(table, column, options)`
- Pattern: static validator in controller

### Established Patterns
- Controllers: `render()` + `execute()`
- Services: pure business logic
- Presenters: data formatting for JSON
- Middleware: auth, guest, silentAuth
- Flash messages: success, error, warning, info
- Redirects: `toRoute()` or `back()`

### Naming Conventions
- Controllers: `{Action}Controller`
- Services: `{Domain}Service`
- Models: Singular PascalCase
- Tables: plural snake_case
- Columns: snake_case
- Props/variables: camelCase
- Components: PascalCase, named exports
- Pages: PascalCase, default export

---

**⚠️ Important:** This file should be updated every time a new service, helper, or important pattern is introduced to the project.
