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
  async sendResetPasswordLink(user: User): Promise<void>
  // Generates random(64) token, expires old tokens, creates new one with 1h expiration,
  // builds reset link, sends HTML email
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
  githubId: string | null
  googleId: string | null
  facebookId: string | null
  createdAt: string
  updatedAt: string | null
}

export class UserPresenter {
  static toJSON(user: User | undefined | null): UserPresenterData | null
  // Returns all user data (for owner/admin)
  
  static toPublicJSON(user: User | undefined | null)
  // Returns only id, email, fullName, dates (no OAuth IDs)
  
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
  async execute({ auth, request, response, session }: HttpContext)
  // Dynamic validator with exceptId
  // Updates fullName and email
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
  },
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
  static,
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
])

export const middleware = router.named({
  guest: () => import('#core/middleware/guest_middleware'),
  auth: () => import('#core/middleware/auth_middleware'),
})
```

### start/routes.ts
```typescript
// Structure:
router.group(() => {
  // Auth routes (login, register, forgot, reset)
}).use(middleware.guest())

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
