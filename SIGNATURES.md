# 📝 Existing Code Signatures

This file contains the signatures (public interfaces) of all important files in the boilerplate.
**Do not copy the complete code, just the signatures to avoid duplication.**

---

## 🔐 AUTH - Controllers

### app/auth/controllers/login_controller.ts
```typescript
export default class LoginController {
  static validator = vine.compile(
    vine.object({
      email: vine.string().trim().toLowerCase().email(),
      password: vine.string(),
      remember_me: vine.boolean().optional(),
    })
  )
  render({ inertia }: HttpContext)
  async execute({ auth, request, response, session, i18n }: HttpContext)
  // After successful login: regenerateCsrfToken() is called
}
```

### app/auth/controllers/register_controller.ts
```typescript
export default class RegisterController {
  static validator = vine.compile(
    vine.object({
      email: vine.string().trim().toLowerCase().email().unique(unique('users', 'email')),
      password: vine.string().minLength(8).confirmed(),
    })
  )
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
  static validator = vine.compile(
    vine.object({
      email: vine.string().trim().toLowerCase().email(),
    })
  )
  constructor(protected passwordService: PasswordService)
  render({ inertia }: HttpContext)
  async execute({ request, response, session, i18n }: HttpContext)
}
```

### app/auth/controllers/reset_password_controller.ts
```typescript
export default class ResetPasswordController {
  static validator = vine.compile(
    vine.object({
      token: vine.string(),
      password: vine.string().minLength(8).confirmed(),
    })
  )

  async render({ inertia, params, session, response, i18n }: HttpContext)
  async execute({ request, response, session, auth, i18n }: HttpContext)
}
```

### app/auth/controllers/social_controller.ts
```typescript
type OAuthProvider = 'github' | 'google' | 'facebook'

@inject()
export default class SocialController {
  constructor(protected socialService: SocialService)
  static definePasswordValidator = vine.compile(...)
  
  protected validateProvider(provider: string, session: any, response: any, i18n: any)
  async redirect({ ally, params, session, response, i18n }: HttpContext)
  async callback({ ally, params, auth, request, response, session, i18n }: HttpContext)
  // After OAuth linking: regenerateCsrfToken() is called
  
  async unlink({ auth, params, request, response, session, i18n }: HttpContext)
  // After OAuth unlinking: regenerateCsrfToken() is called
  
  render({ inertia }: HttpContext)
  async execute({ auth, request, response, session, i18n }: HttpContext)
}
```

---

## 🔐 AUTH - Services

### app/auth/services/password_service.ts
```typescript
export default class PasswordService {
  async sendResetPasswordLink(user: User): Promise<void>
}
```

### app/auth/services/social_service.ts
```typescript
export default class SocialService {
  async findOrCreateUser(
    allyUser: AllyUserContract<any>,
    provider: 'github' | 'google' | 'facebook'
  ): Promise<User>
  
  async linkProvider(
    user: User,
    allyUser: AllyUserContract<any>,
    provider: 'github' | 'google' | 'facebook'
  ): Promise<void>
  
  async unlinkProvider(
    user: User,
    provider: 'github' | 'google' | 'facebook'
  ): Promise<void>
  
  needsPasswordSetup(user: User): boolean
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
  locale: string | null
  githubId: string | null
  googleId: string | null
  facebookId: string | null
  createdAt: string
  updatedAt: string | null
}

export class UserPresenter {
  static toJSON(user: User | undefined | null): UserPresenterData | null
  static toPublicJSON(user: User | undefined | null)
  static hasLinkedProviders(user: User): boolean
  static getLinkedProviders(user: User): { github: boolean, google: boolean, facebook: boolean }
}
```

---

## 🔐 AUTH - Helpers

### app/auth/helpers/oauth.ts
```typescript
export type OAuthProviderName = 'github' | 'google' | 'facebook'

export interface OAuthProviderConfig {
  name: string
  icon: string
  color: string
  enabled: boolean
}

export const OAUTH_PROVIDERS: Record<OAuthProviderName, OAuthProviderConfig>

export function getEnabledProviders(): OAuthProviderConfig[]
export function isProviderActive(provider: OAuthProviderName): boolean
export function getProviderConfig(provider: OAuthProviderName): OAuthProviderConfig | null
```

---

## 🗃️ CORE - Services

### app/core/services/cache_service.ts
```typescript
export default class CacheService {
  async get(key: string): Promise<any>
  async set(key: string, value: any, ttlSeconds?: number): Promise<void>
  async delete(key: string): Promise<void>
  async has(key: string): Promise<boolean>
  async flush(): Promise<void>
  async increment(key: string, value: number, ttlSeconds?: number): Promise<number>
  async decrement(key: string, value: number, ttlSeconds?: number): Promise<number>
  async getMany(keys: string[]): Promise<Map<string, any>>
  async setMany(entries: Map<string, any>, ttlSeconds?: number): Promise<void>
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
  async attempt(key: string, maxAttempts: number, decaySeconds: number): Promise<RateLimitResult>
  async reset(key: string): Promise<void>
  async remaining(key: string, maxAttempts: number): Promise<number>
  async clear(): Promise<void>
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
  
  static async cleanExpired(): Promise<number>
}
```

### app/core/models/token.ts
```typescript
export default class Token extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare public userId: number | null

  @column()
  declare public type: string

  @column()
  declare public token: string

  @column()
  declare public attempts: number

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare public user: BelongsTo<typeof User>

  static readonly MAX_RESET_ATTEMPTS = 3

  static async expirePasswordResetTokens(user: User): Promise<void>
  static async getPasswordResetUser(plainToken: string): Promise<User | undefined>
  static async verify(plainToken: string): Promise<boolean>
  static async incrementAttempts(plainToken: string): Promise<void>
  static async hasExceededAttempts(plainToken: string): Promise<boolean>
}
```

---

## 🗃️ CORE - Helpers

### app/core/helpers/redis.ts
```typescript
export async function isRedisAvailable(): Promise<boolean>
export async function getRedisConnection()
export function resetRedisCheck()
```

### app/core/helpers/crypto.ts
```typescript
export function randomBytes(length: number): string
export function generateToken(bytes: number = 64): string
export function maskToken(token: string, visibleChars: number = 10): string
```

### app/core/helpers/csrf.ts
```typescript
export function regenerateCsrfToken(ctx: HttpContext): void
export async function verifyCsrfToken(ctx: HttpContext): Promise<boolean>
```

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

export function exists(table: string, column: string, options?: DatabaseOptions)
export function unique(table: string, column: string, options?: DatabaseOptions)
```

### app/core/helpers/sleep.ts
```typescript
export function sleep(time: number): Promise<void>
```

---

## 🗃️ CORE - Exceptions

### app/core/exceptions/csrf_token_mismatch_exception.ts
```typescript
export default class CsrfTokenMismatchException extends Exception {
  static status = 419
  static code = 'E_CSRF_TOKEN_MISMATCH'

  constructor(message: string = 'CSRF token mismatch')
  async handle(error: this, ctx: HttpContext)
}
```

### app/core/exceptions/too_many_requests_exception.ts
```typescript
export default class TooManyRequestsException extends Exception {
  static status = 429
  static code = 'E_TOO_MANY_REQUESTS'
  
  constructor(message: string, public retryAfter?: number)
  async handle(error: this, ctx: HttpContext)
}
```

### app/core/exceptions/handler.ts
```typescript
export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction
  
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (error, { inertia }) => inertia.render('errors/not_found', { error }),
    '419': (error, { inertia }) => inertia.render('errors/csrf_token_mismatch', { error }),
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
}
```

### app/profile/controllers/profile_update_controller.ts
```typescript
export default class ProfileUpdateController {
  async execute({ auth, request, response, session, i18n }: HttpContext)
  // Regenerates CSRF token after email or locale change
}
```

### app/profile/controllers/profile_update_password_controller.ts
```typescript
export default class ProfileUpdatePasswordController {
  static validator = vine.compile(
    vine.object({
      current_password: vine.string(),
      password: vine.string().minLength(8).confirmed(),
    })
  )
  
  async execute({ auth, request, response, session, i18n }: HttpContext)
  // Regenerates CSRF token after password change
}
```

### app/profile/controllers/profile_delete_controller.ts
```typescript
export default class ProfileDeleteController {
  static validator = vine.compile(
    vine.object({
      password: vine.string(),
    })
  )
  
  async execute({ auth, request, response, session, i18n }: HttpContext)
}
```

### app/profile/controllers/profile_clean_notifications_controller.ts
```typescript
export default class ProfileCleanNotificationsController {
  async execute({ auth, response, session, i18n }: HttpContext)
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
}
```

### app/core/middleware/silent_auth_middleware.ts
```typescript
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn)
}
```

### app/core/middleware/container_bindings_middleware.ts
```typescript
export default class ContainerBindingsMiddleware {
  handle(ctx: HttpContext, next: NextFn)
}
```

### app/core/middleware/detect_user_locale_middleware.ts
```typescript
export default class DetectUserLocaleMiddleware {
  static {
    RequestValidator.messagesProvider = (ctx) => {
      return ctx.i18n.createMessagesProvider()
    }
  }

  protected getRequestLocale(ctx: HttpContext): string
  async handle(ctx: HttpContext, next: NextFn)
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
  max: number
  window: number
  keyGenerator?: (ctx: HttpContext) => string
}

@inject()
export default class ThrottleMiddleware {
  constructor(protected rateLimitService: RateLimitService)
  
  async handle(ctx: HttpContext, next: NextFn, options?: ThrottleOptions)
  private generateKey(ctx: HttpContext): string
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
}
```

### commands/cleanup_rate_limits.ts
```typescript
export default class CleanupRateLimits extends BaseCommand {
  static commandName = 'cleanup:rate-limits'
  static description = 'Clean expired rate limit entries from database'

  async run()
}
```

---

## ⚛️ REACT - Entry Points

### inertia/app/app.tsx
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
    const locale = String(props.initialPage.props.locale || 'en')
    i18n.changeLanguage(locale)
    
    const applicationTree = <App {...props} />
    hydrateRoot(el, applicationTree)
  },
})
```

### inertia/app/ssr.tsx
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
```

---

## ⚛️ REACT - Components / Forms

### inertia/components/forms/input.tsx
```typescript
interface InputProps {
  name: string
  type: string
  placeholder?: string
  value?: string | number
  checked?: boolean
  options?: Array<{ value: string; label: string }>
  cols?: number
  rows?: number
  disabled?: boolean
  required?: boolean
  onChange?: (event: ChangeEvent<...>) => void
  onBlur?: (event: ChangeEvent<...>) => void
}

export function Input(props: InputProps)
```

### inertia/components/forms/label.tsx
```typescript
interface LabelProps {
  label: string
  htmlFor: string
  required?: boolean
}

export function Label(props: LabelProps)
```

### inertia/components/forms/input_group.tsx
```typescript
interface InputGroupProps {
  label: string
  name: string
  type: string
  placeholder?: string
  value?: string | number
  checked?: boolean
  options?: Array<{ value: string; label: string }>
  cols?: number
  rows?: number
  disabled?: boolean
  required?: boolean
  errorMessage?: string
  helpText?: string
  helpClassName?: string
  onChange?: (event: ChangeEvent<...>) => void
  onBlur?: (event: ChangeEvent<...>) => void
  sanitize?: boolean
}

export function InputGroup(props: InputGroupProps)
```

---

## ⚛️ REACT - Components / Layouts

### inertia/components/layouts/app_shell.tsx
```typescript
interface AppShellProps {
  children: ReactNode
}

export default function AppShell(props: AppShellProps)
```

### inertia/components/layouts/page_header.tsx
```typescript
export function PageHeader()
```

---

## ⚛️ REACT - Pages / Errors

### inertia/pages/errors/csrf_token_mismatch.tsx
```typescript
interface CsrfErrorProps {
  error?: {
    message: string
  }
}

export default function CsrfTokenMismatch({ error }: CsrfErrorProps)
```

### inertia/pages/errors/not_found.tsx
```typescript
export default function NotFound()
```

### inertia/pages/errors/server_error.tsx
```typescript
export default function ServerError(props: { error: any })
```

---

## ⚛️ REACT - Pages / Auth

### inertia/pages/auth/login.tsx
```typescript
interface LoginPageProps {
  providers: OAuthProvider[]
}

export default function LoginPage(props: LoginPageProps)
```

### inertia/pages/auth/register.tsx
```typescript
interface RegisterPageProps {
  providers: OAuthProvider[]
}

export default function RegisterPage(props: RegisterPageProps)
```

### inertia/pages/auth/forgot_password.tsx
```typescript
export default function ForgotPasswordPage()
```

### inertia/pages/auth/reset_password.tsx
```typescript
interface ResetPasswordPageProps {
  token: string
}

export default function ResetPasswordPage(props: ResetPasswordPageProps)
```

### inertia/pages/auth/define_password.tsx
```typescript
export default function DefinePasswordPage()
```

---

## ⚛️ REACT - Pages / Profile

### inertia/pages/profile/show.tsx
```typescript
interface LinkedProviders {
  github: boolean
  google: boolean
  facebook: boolean
}

interface ProfilePageProps {
  notifications: any[]
  providers: OAuthProvider[]
  linkedProviders: LinkedProviders
}

export default function ProfilePage(props: ProfilePageProps)
```

---

## ⚛️ REACT - Helpers

### inertia/helpers/oauth.ts
```typescript
export function getProviderRoute(providerName: string): string
```

### inertia/helpers/validation_rules.ts
```typescript
export interface ValidationResult {
  valid: boolean
  message?: string
}

export type ValidationRule = (value: any, fieldNameKey?: string) => ValidationResult

export const rules = {
  required: (fieldNameKey?: string): ValidationRule
  email: (): ValidationRule
  minLength: (min: number, fieldNameKey?: string): ValidationRule
  maxLength: (max: number, fieldNameKey?: string): ValidationRule
  matches: (otherValue: any, otherFieldNameKey: string): ValidationRule
  pattern: (regex: RegExp, customI18nKey: string): ValidationRule
  custom: (validator: (value: any) => boolean, i18nKey: string): ValidationRule
}

export function validate(
  value: any,
  validationRules: ValidationRule[],
  fieldNameKey?: string
): ValidationResult

export const presets = {
  email: ValidationRule[]
  password: ValidationRule[]
  passwordConfirmation: (passwordToMatch: string) => ValidationRule[]
  currentPassword: ValidationRule[]
  fullName: ValidationRule[]
}
```

### inertia/helpers/sanitization.ts
```typescript
export interface SanitizationOptions {
  stripHtml?: boolean
  trim?: boolean
  lowercase?: boolean
  removeMultipleSpaces?: boolean
}

export function sanitize(value: string, options?: SanitizationOptions): string
export function sanitizeEmail(value: string): string
export function sanitizeText(value: string): string
export function noSanitization(value: string): string
```

---

## ⚛️ REACT - Hooks

### inertia/hooks/use_form_validation.ts
```typescript
export interface FieldState {
  touched: boolean
  typing: boolean
  validation: ValidationResult
  status: 'pristine' | 'valid' | 'invalid'
}

export interface FormValidationConfig {
  [fieldName: string]: ValidationRule[]
}

export function useFormValidation(config: FormValidationConfig) {
  return {
    fieldStates: Record<string, FieldState>
    getFieldState: (fieldName: string) => FieldState
    handleChange: (fieldName: string, value: any) => void
    handleBlur: (fieldName: string, value: any) => void
    validateAll: (values: Record<string, any>) => boolean
    reset: () => void
    getValidationMessage: (fieldName: string) => string | undefined
    getHelpClassName: (fieldName: string) => string
  }
}
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

## ⚛️ REACT - Lib

### inertia/lib/i18n.ts
```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Configures i18n for React
// Namespaces: ['auth', 'profile', 'common', 'errors', 'validation']
// Default locale: 'en'

export default i18n
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

export const enabledProviders: Array<'github' | 'google' | 'facebook'>
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
const i18nConfig = defineConfig({
  defaultLocale: 'en',
  supportedLocales: ['en', 'fr'],
  fallbackLocales: {
    'fr-*': 'fr',
    'en-*': 'en',
  },
  loaders: [
    loaders.fs({
      location: app.languageFilesPath(),
    }),
  ],
})
```

### config/session.ts
```typescript
const sessionConfig = defineConfig({
  enabled: true,
  cookieName: 'adonis-session',
  clearWithBrowser: false,
  age: '2h',
  cookie: { path: '/', httpOnly: true, secure: app.inProduction, sameSite: 'lax' },
  store: env.get('SESSION_DRIVER'),
  stores: {
    cookie: stores.cookie(),
    redis: stores.redis({
      connection: 'main',
    }),
  },
})
```

---

## 🗄️ DATABASE - Migrations

### 1765907203210_create_users_table.ts
```typescript
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### 1765989606897_create_remember_me_tokens_table.ts
```typescript
export default class extends BaseSchema {
  protected tableName = 'remember_me_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments()
      table.integer('tokenable_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('hash').notNullable().unique()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
      table.timestamp('expires_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### 1766017009920_create_tokens_table.ts
```typescript
export default class extends BaseSchema {
  protected tableName = 'tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('type').notNullable()
      table.string('token', 64).notNullable()
      table.timestamp('expires_at')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### 1766157032668_add_oauth_columns_to_users_table.ts
```typescript
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('github_id').nullable().unique()
      table.string('google_id').nullable().unique()
      table.string('facebook_id').nullable().unique()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('github_id')
      table.dropColumn('google_id')
      table.dropColumn('facebook_id')
    })
  }
}
```

### 1766268717077_add_locale_to_users_table.ts
```typescript
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
export default class extends BaseSchema {
  protected tableName = 'rate_limits'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('key', 255).notNullable().unique()
      table.integer('hits').notNullable().defaultTo(0)
      table.timestamp('reset_at').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.index('reset_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### 1766503909953_add_attempts_to_tokens_table.ts
```typescript
export default class extends BaseSchema {
  protected tableName = 'tokens'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('attempts').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('attempts')
    })
  }
}
```

### 1766504715515_alter_tokens_add_longer_hashes_table.ts
```typescript
export default class extends BaseSchema {
  protected tableName = 'tokens'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('token', 255).notNullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('token', 64).notNullable().alter()
    })
  }
}
```

---

## 🌐 TRANSLATIONS - Backend

### resources/lang/en/auth.json
```json
{
  "login": {
    "success": "You have been successfully logged in.",
    "failed": "Authentication failed. Please try again."
  },
  "register": {
    "success": "Your account has been created successfully."
  },
  "logout": {
    "success": "You have been successfully logged out."
  },
  "forgot_password": {
    "email_sent": "If an account exists for this email, you will receive a reset link shortly."
  },
  "reset_password": {
    "success": "Your password has been reset successfully.",
    "invalid_token": "Invalid or expired password reset link.",
    "max_attempts_exceeded": "This password reset link has been used too many times. Please request a new one.",
    "failed": "Failed to reset password. Please try again."
  },
  "social": {
    "not_configured": "{provider} authentication is not configured.",
    "linked": "Your {provider} account has been linked successfully.",
    "set_password_info": "Please set a password for your account to enable password login.",
    "unlinked": "Your {provider} account has been unlinked.",
    "unlink_failed": "Failed to unlink account.",
    "password_defined": "Your password has been set successfully."
  }
}
```

### resources/lang/en/errors.json
```json
{
  "too_many_requests": "Too many requests. Please try again in {minutes} minute(s).",
  "rate_limit_exceeded": "Rate limit exceeded. Please slow down.",
  "csrf_token_mismatch": "Your session has expired. Please refresh the page and try again."
}
```

### resources/lang/en/profile.json
```json
{
  "update": {
    "success": "Your profile has been updated successfully."
  },
  "password": {
    "incorrect_current": "The current password is incorrect.",
    "success": "Your password has been updated successfully."
  },
  "delete": {
    "incorrect_password": "The password is incorrect.",
    "success": "Your account has been deleted successfully."
  },
  "notifications": {
    "cleared": "Your notifications have been cleared successfully."
  },
  "locale": {
    "updated": "Your language preference has been updated successfully."
  }
}
```

### resources/lang/en/emails.json
```json
{
  "reset_password": {
    "subject": "Reset your password",
    "greeting": "Hello,",
    "intro": "You are receiving this email because we received a password reset request for your account.",
    "action": "Reset Password",
    "outro": "If you did not request a password reset, no further action is required.",
    "expiry": "This password reset link will expire in {hours} hour. | This password reset link will expire in {hours} hours.",
    "footer": "If you're having trouble clicking the button, copy and paste the URL below into your web browser:"
  }
}
```

### resources/lang/fr/auth.json
```json
{
  "login": {
    "success": "Vous avez été connecté avec succès.",
    "failed": "Échec de l'authentification. Veuillez réessayer."
  },
  "register": {
    "success": "Votre compte a été créé avec succès."
  },
  "logout": {
    "success": "Vous avez été déconnecté avec succès."
  },
  "forgot_password": {
    "email_sent": "Si un compte existe pour cet e-mail, vous recevrez un lien de réinitialisation sous peu."
  },
  "reset_password": {
    "success": "Votre mot de passe a été réinitialisé avec succès.",
    "invalid_token": "Lien de réinitialisation invalide ou expiré.",
    "max_attempts_exceeded": "Ce lien de réinitialisation a été utilisé trop de fois. Veuillez en demander un nouveau.",
    "failed": "Échec de la réinitialisation du mot de passe. Veuillez réessayer."
  },
  "social": {
    "not_configured": "L'authentification {provider} n'est pas configurée.",
    "linked": "Votre compte {provider} a été lié avec succès.",
    "set_password_info": "Veuillez définir un mot de passe pour votre compte afin d'activer la connexion par mot de passe.",
    "unlinked": "Votre compte {provider} a été dissocié.",
    "unlink_failed": "Échec de la dissociation du compte.",
    "password_defined": "Votre mot de passe a été défini avec succès."
  }
}
```

### resources/lang/fr/errors.json
```json
{
  "too_many_requests": "Trop de requêtes. Veuillez réessayer dans {minutes} minute(s).",
  "rate_limit_exceeded": "Limite de taux dépassée. Veuillez ralentir.",
  "csrf_token_mismatch": "Votre session a expiré. Veuillez actualiser la page et réessayer."
}
```

### resources/lang/fr/profile.json
```json
{
  "update": {
    "success": "Votre profil a été mis à jour avec succès."
  },
  "password": {
    "incorrect_current": "Le mot de passe actuel est incorrect.",
    "success": "Votre mot de passe a été mis à jour avec succès."
  },
  "delete": {
    "incorrect_password": "Le mot de passe est incorrect.",
    "success": "Votre compte a été supprimé avec succès."
  },
  "notifications": {
    "cleared": "Vos notifications ont été effacées avec succès."
  },
  "locale": {
    "updated": "Votre préférence de langue a été mise à jour avec succès."
  }
}
```

---

## 🌐 TRANSLATIONS - Frontend

### inertia/locales/en/auth.json
```json
{
  "login": {
    "title": "Welcome back!",
    "subtitle": "Please log in to continue.",
    "email": "Email",
    "email_placeholder": "john.doe@example.com",
    "password": "Password",
    "remember_me": "Remember me",
    "forgot_password": "Forgot your password?",
    "submit": "Login",
    "or_continue_with": "Or continue with",
    "no_account": "Don't have an account yet?",
    "create_account": "Create an account"
  },
  "register": {
    "title": "Welcome!",
    "subtitle": "Please register to continue.",
    "email": "Email",
    "email_placeholder": "john.doe@example.com",
    "password": "Password",
    "confirmation": "Confirmation",
    "password_help": "For optimal security, your password must be at least 8 characters long.",
    "confirmation_help": "Re-enter your password to verify that there are no typing errors.",
    "submit": "Register",
    "or_continue_with": "Or continue with",
    "has_account": "Do you already have an account?",
    "login": "Login"
  },
  "forgot_password": {
    "title": "Reset Password",
    "subtitle": "Enter your email and we'll send you a link to reset your password.",
    "email": "Email address",
    "email_placeholder": "your-email@example.com",
    "submit": "Send Reset Link",
    "back_to_login": "Back to login"
  },
  "reset_password": {
    "title": "Reset Password",
    "subtitle": "Enter your new password.",
    "new_password": "New password",
    "confirmation": "Confirmation",
    "password_help": "For optimal security, your password must be at least 8 characters long.",
    "confirmation_help": "Re-enter your password to verify that there are no typing errors.",
    "submit": "Reset",
    "back_to_login": "Back to login"
  },
  "define_password": {
    "title": "Welcome!",
    "subtitle": "Please define your password to continue.",
    "password": "Password",
    "confirmation": "Confirmation",
    "password_help": "For optimal security, your password must be at least 8 characters long.",
    "confirmation_help": "Re-enter your password to verify that there are no typing errors.",
    "submit": "Define"
  }
}
```

### inertia/locales/en/common.json
```json
{
  "header": {
    "home": "Home",
    "greeting": "Hello, {name}",
    "login": "Login",
    "menu_label": "Menu"
  },
  "flash": {
    "close_label": "Close"
  },
  "select": {
    "default_placeholder": "Select an option"
  },
  "language": {
    "selector_label": "Language",
    "en": "English",
    "fr": "Français"
  }
}
```

### inertia/locales/en/errors.json
```json
{
  "not_found": {
    "title": "Page not found",
    "message": "This page does not exist."
  },
  "server_error": {
    "title": "Server Error"
  },
  "csrf_token_mismatch": {
    "title": "Session Expired",
    "message": "Your session has expired for security reasons.",
    "explanation": "This usually happens when you've been inactive for a while or opened multiple tabs. Please reload the page to continue.",
    "reload": "Reload Page",
    "go_home": "Go to Homepage"
  }
}
```

### inertia/locales/en/profile.json
```json
{
  "title": "My Profile",
  "subtitle": "Manage your account settings and preferences",
  "sections": {
    "profile_info": {
      "title": "Profile Information",
      "subtitle": "Update your account's profile information and email address.",
      "full_name": "Full Name",
      "full_name_placeholder": "John Doe",
      "email": "Email Address",
      "email_placeholder": "john.doe@example.com",
      "locale": "Preferred language",
      "submit": "Save Changes"
    },
    "connected_accounts": {
      "title": "Connected Accounts",
      "subtitle": "Manage your OAuth provider connections.",
      "connected": "Connected",
      "not_connected": "Not connected",
      "unlink": "Unlink",
      "connect": "Connect",
      "confirm_unlink": "Are you sure you want to unlink your {provider} account?"
    },
    "update_password": {
      "title": "Update Password",
      "subtitle": "Ensure your account is using a long, random password to stay secure.",
      "current_password": "Current Password",
      "new_password": "New Password",
      "confirm_password": "Confirm Password",
      "password_help": "For optimal security, your password must be at least 8 characters long.",
      "confirmation_help": "Re-enter your password to verify that there are no typing errors.",
      "submit": "Update Password"
    },
    "delete_account": {
      "title": "Delete Account",
      "subtitle": "Once your account is deleted, all of its resources and data will be permanently deleted.",
      "submit": "Delete Account",
      "confirm_title": "Are you sure you want to delete your account?",
      "confirm_subtitle": "Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.",
      "password": "Password",
      "password_placeholder": "Enter your password to confirm",
      "cancel": "Cancel",
      "confirm_delete": "Are you sure you want to delete your account? This action is irreversible."
    }
  }
}
```

### inertia/locales/en/validation.json
```json
{
  "required": "{field} is required",
  "email": "Please enter a valid email address",
  "min_length": "{field} must be at least {min} characters (currently: {current})",
  "max_length": "{field} must be at most {max} characters (currently: {current})",
  "matches": "Must match {other}",
  "fields": {
    "email": "Email",
    "password": "Password",
    "password_confirmation": "Password confirmation",
    "current_password": "Current password",
    "full_name": "Full name"
  }
}
```

### inertia/locales/fr/errors.json
```json
{
  "not_found": {
    "title": "Page introuvable",
    "message": "Cette page n'existe pas."
  },
  "server_error": {
    "title": "Erreur Serveur"
  },
  "csrf_token_mismatch": {
    "title": "Session Expirée",
    "message": "Votre session a expiré pour des raisons de sécurité.",
    "explanation": "Cela se produit généralement après une période d'inactivité ou si vous avez ouvert plusieurs onglets. Veuillez recharger la page pour continuer.",
    "reload": "Recharger la Page",
    "go_home": "Aller à l'Accueil"
  }
}
```

---

## 🚀 START

### start/env.ts
```typescript
export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test']),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string.optional(),
  HOST: Env.schema.string({ format: 'host' }),
  DOMAIN: Env.schema.string(),
  LOG_LEVEL: Env.schema.string(),
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory']),
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),
  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.string(),
  SMTP_USERNAME: Env.schema.string(),
  SMTP_PASSWORD: Env.schema.string(),
  SMTP_FROM_ADDRESS: Env.schema.string(),
  GITHUB_CLIENT_ID: Env.schema.string.optional(),
  GITHUB_CLIENT_SECRET: Env.schema.string.optional(),
  GITHUB_CALLBACK_URL: Env.schema.string.optional(),
  GOOGLE_CLIENT_ID: Env.schema.string.optional(),
  GOOGLE_CLIENT_SECRET: Env.schema.string.optional(),
  GOOGLE_CALLBACK_URL: Env.schema.string.optional(),
  FACEBOOK_CLIENT_ID: Env.schema.string.optional(),
  FACEBOOK_CLIENT_SECRET: Env.schema.string.optional(),
  FACEBOOK_CALLBACK_URL: Env.schema.string.optional(),
  REDIS_ENABLED: Env.schema.boolean(),
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),
})
```

### start/kernel.ts
```typescript
server.errorHandler(() => import('#core/exceptions/handler'))

server.use([
  () => import('#core/middleware/container_bindings_middleware'),
  () => import('@adonisjs/static/static_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('@adonisjs/vite/vite_middleware'),
  () => import('@adonisjs/inertia/inertia_middleware'),
])

router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/session/session_middleware'),
  () => import('@adonisjs/shield/shield_middleware'),  // CSRF protection
  () => import('@adonisjs/auth/initialize_auth_middleware'),
  () => import('#auth/middleware/silent_auth_middleware'),
  () => import('#core/middleware/detect_user_locale_middleware'),
])

export const middleware = router.named({
  guest: () => import('#core/middleware/guest_middleware'),
  auth: () => import('#core/middleware/auth_middleware'),
  throttle: () => import('#core/middleware/throttle_middleware'),
})
```

### start/routes.ts
```typescript
// All routes with POST/PUT/PATCH/DELETE are automatically protected by CSRF via Shield

router.on('/').renderInertia('landing').as('landing')

router
  .group(() => {
    router.get('/login', [LoginController, 'render']).as('auth.login')
    router.post('/login', [LoginController, 'execute']).use(middleware.throttle({ max: 5, window: 900 }))

    router.get('/register', [RegisterController, 'render']).as('auth.register')
    router.post('/register', [RegisterController, 'execute']).use(middleware.throttle({ max: 3, window: 3600 }))

    router.get('/forgot-password', [ForgotPasswordController, 'render']).as('auth.forgot_password')
    router.post('/forgot-password', [ForgotPasswordController, 'execute']).use(middleware.throttle({ max: 3, window: 3600 }))

    router.get('/reset-password/:token', [ResetPasswordController, 'render']).as('auth.reset_password')
    router.post('/reset-password', [ResetPasswordController, 'execute']).use(middleware.throttle({ max: 3, window: 900 }))
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
    router.put('/password', [ProfileUpdatePasswordController, 'execute']).as('profile.password.update')
    router.delete('/', [ProfileDeleteController, 'execute']).as('profile.delete')
    router.delete('/notifications', [ProfileCleanNotificationsController, 'execute']).as('profile.notifications.clean')
  })
  .prefix('profile')
  .use(middleware.auth())
```

---

## 📝 Important Notes

### Injectable Services
- PasswordService
- SocialService
- CacheService
- RateLimitService

### Reusable Validators
- `unique(table, column, options)` with exceptId
- `exists(table, column, options)`
- Pattern: static validator in controller

### Established Patterns
- Controllers: `render()` + `execute()`
- Services: pure business logic
- Presenters: data formatting for JSON
- Middleware: auth, guest, silentAuth, throttle
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

### Security Best Practices
- **CSRF Protection**: Automatic via Shield on all POST/PUT/PATCH/DELETE
- **Token Regeneration**: Call `regenerateCsrfToken()` after sensitive actions (login, password change, email change, OAuth linking)
- **Rate Limiting**: Apply on authentication and sensitive endpoints
- **Password Hashing**: Always use Scrypt with high cost factor
- **Token Masking**: Use `maskToken()` for logging sensitive tokens
- **Input Sanitization**: Frontend + Backend validation
- **Logging**: Log all security events with context (IP, user agent, etc.)

---

**⚠️ Important:** This file should be updated every time a new service, helper, or important pattern is introduced to the project.
