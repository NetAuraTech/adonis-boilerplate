# 🗃️ AdonisJS + Inertia + React Boilerplate Architecture

## 📋 Overview

**Tech Stack:**
- Backend: AdonisJS 6 (TypeScript)
- Frontend: Inertia.js + React 18 + TypeScript
- Styling: Custom SCSS (no Tailwind)
- Database: PostgreSQL + Lucid ORM
- Auth: Session-based with Remember Me tokens
- OAuth: Ally (GitHub, Google, Facebook)
- Email: AdonisJS Mail (SMTP)
- Tests: Japa (backend) + Jest (frontend) + Playwright (E2E)
- Build: Vite

**Environment Constraints:**
- Hosting: o2Switch (shared)
- Redis: Available with fallback required
- Cron jobs: Available
- WebSockets: Not available (use SSE with Transmit)
- SSH: Access available

---

## 📁 Folder Structure
```
app/
├── auth/                           # Authentication domain
│   ├── controllers/               # LoginController, RegisterController, etc.
│   ├── models/                    # User
│   ├── services/                  # PasswordService, SocialService
│   ├── middleware/                # silent_auth_middleware
│   ├── presenters/                # UserPresenter
│   └── helpers/                   # oauth.ts (getEnabledProviders, etc.)
│
├── profile/                       # User profile domain
│   └── controllers/               # ProfileShowController, ProfileUpdateController, etc.
│
├── core/                          # Cross-cutting domain
│   ├── exceptions/               # HttpExceptionHandler
│   ├── helpers/                  # validator.ts, sleep.ts
│   ├── middleware/               # auth, guest, container_bindings, detect_locale [NEW]
│   └── models/                   # Token
│
config/                            # AdonisJS configuration
├── auth.ts                       # Session guard, remember me
├── ally.ts                       # OAuth providers
├── database.ts                   # PostgreSQL
├── mail.ts                       # SMTP
├── session.ts                    # Session cookie
├── inertia.ts                    # Inertia SSR + shared data
├── shield.ts                     # CSRF, XFrame, HSTS
├── hash.ts                       # Scrypt
├── i18n.ts                       # i18n configuration [NEW]
├── logger.ts                     # Logs
└── ...

database/
└── migrations/                    # Lucid migrations

resources/                        
├── lang/                         # Backend translations
│   ├── en/                       # English translations
│   │   ├── auth.json             # Authentication messages
│   │   ├── profile.json          # Profile messages
│   │   └── emails.json           # Email content
│   └── fr/                       # French translations
│       ├── auth.json
│       ├── profile.json
│       └── emails.json
│
└── views/                        # Edge templates
    └── emails/                   # Email templates
        └── reset_password.edge  # Password reset email

inertia/
├── app/                          # Entry points
│   ├── app.tsx                   # Client-side entry (with i18n setup) [UPDATED]
│   └── ssr.tsx                   # Server-side rendering (with i18n setup) [UPDATED]
│
├── assets/                       # Static assets
│   ├── fonts/                    # Atkinson Hyperlegible
│   ├── scss/                     # Design system
│   │   ├── abstracts/           # Tokens, colors, typography
│   │   ├── base/                # Reset, root, font-face
│   │   ├── components/          # Headings, navigation, toasts
│   │   ├── layout/              # Grid, display, position
│   │   ├── utilities/           # Utility classes
│   │   └── app.scss             # Main import
│   └── logo.png
│
├── components/                   # React components
│   ├── elements/                # Button, NavLink, Panel, FlashMessages
│   ├── forms/                   # Input, InputGroup, Label
│   └── layouts/                 # AppShell, PageHeader
│
├── lib/                          # Frontend libraries
│   └── i18n.ts                  # i18n configuration (react-i18next)
│
├── locales/                      # Frontend translations
│   ├── en/                      # English translations
│   │   ├── auth.json           # Auth pages translations
│   │   ├── profile.json        # Profile page translations
│   │   ├── common.json         # Common UI translations
│   │   └── errors.json         # Error pages translations
│   └── fr/                      # French translations
│       ├── auth.json
│       ├── profile.json
│       ├── common.json
│       └── errors.json
│
├── pages/                        # Inertia pages
│   ├── auth/                    # Login, Register, ForgotPassword, etc.
│   ├── profile/                 # Show
│   ├── errors/                  # NotFound, ServerError
│   └── landing.tsx
│
├── types/                        # Frontend TypeScript types
│   └── oauth.ts
│
└── helpers/                      # Frontend helpers
    └── oauth.ts

start/
├── env.ts                        # Environment variables validation
├── kernel.ts                     # Middleware configuration (with detect_locale) [UPDATED]
└── routes.ts                     # Route definitions

bin/
├── server.ts                     # HTTP server entry
├── console.ts                    # CLI entry
└── test.ts                       # Test runner entry

commands/
└── create_user.ts                # CLI command to create a user
```

---

## 🎨 Patterns and Conventions

### 1. **Controllers**

**Location:** `app/{domain}/controllers/`

**Naming:**
- `{Action}Controller` (e.g., `LoginController`, `ProfileUpdateController`)
- Always suffixed with `Controller`

**Structure:**
```typescript
export default class SomeController {
  // Static validator with VineJS (if validation needed)
  static validator = vine.compile(
    vine.object({
      email: vine.string().email(),
      // ...
    })
  )

  // render() method for GET (page display)
  render({ inertia }: HttpContext) {
    return inertia.render('domain/page_name', { props })
  }

  // execute() method for POST/PUT/PATCH/DELETE (actions)
  async execute({ request, response, session, auth }: HttpContext) {
    const data = await request.validateUsing(SomeController.validator)
    // Business logic
    session.flash('success', 'Message')
    return response.redirect().toRoute('route.name')
  }
}
```

**Conventions:**
- No complex business logic (delegate to services)
- Always use `session.flash()` for user feedback
- Use `response.redirect().toRoute()` for redirects
- Inject services via constructor with `@inject()`

---

### 2. **Services**

**Location:** `app/{domain}/services/`

**Naming:**
- `{Domain}Service` (e.g., `PasswordService`, `SocialService`)
- Always suffixed with `Service`

**Structure:**
```typescript
export default class SomeService {
  // Business methods
  async doSomething(params: Type): Promise<Result> {
    // Business logic
  }
}
```

**Injection:**
```typescript
@inject()
export default class SomeController {
  constructor(protected someService: SomeService) {}

  async execute() {
    await this.someService.doSomething()
  }
}
```

**Conventions:**
- Services contain business logic
- Reusable between controllers
- No direct HttpContext access (receive data as parameters)
- Always async for consistency

---

### 3. **Models (Lucid ORM)**

**Location:** `app/{domain}/models/`

**Naming:**
- Singular PascalCase (e.g., `User`, `Token`)
- DB table in plural snake_case (e.g., `users`, `tokens`)

**Structure:**
```typescript
export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ serializeAs: null })  // Don't expose in JSON
  declare password: string | null

  @hasMany(() => Token)
  declare tokens: HasMany<typeof Token>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
```

**Conventions:**
- Properties in camelCase (TypeScript)
- DB columns in snake_case (PostgreSQL)
- Lucid handles automatic conversion
- `serializeAs: null` for sensitive data
- Typed relations with HasMany, BelongsTo, etc.

---

### 4. **Presenters**

**Location:** `app/{domain}/presenters/`

**Naming:** `{Model}Presenter` (e.g., `UserPresenter`)

**Structure:**
```typescript
export class UserPresenter {
  // Full version (for admin, owner)
  static toJSON(user: User | undefined | null): UserData | null {
    if (!user) return null
    return {
      id: user.id,
      email: user.email,
      // ... all data
    }
  }

  // Public version (for other users)
  static toPublicJSON(user: User | undefined | null) {
    if (!user) return null
    return {
      id: user.id,
      email: user.email,
      // No sensitive data (OAuth IDs, etc.)
    }
  }

  // Static helpers
  static hasLinkedProviders(user: User): boolean {
    return !!(user.githubId || user.googleId || user.facebookId)
  }
}
```

**Conventions:**
- Never expose `password` or tokens
- `toPublicJSON()` for data shared between users
- Static methods only
- Handle `null`/`undefined` values

---

### 5. **Validators (VineJS)**

**Location:** Inside controllers (static property)

**Structure:**
```typescript
export default class SomeController {
  static validator = vine.compile(
    vine.object({
      email: vine.string().email().unique(unique('users', 'email')),
      password: vine.string().minLength(8).confirmed(),
    })
  )
}
```

**Custom Helpers:**
```typescript
// app/core/helpers/validator.ts
export function unique(table: string, column: string, options?: DatabaseOptions)
export function exists(table: string, column: string, options?: DatabaseOptions)
```

**Conventions:**
- Static validator in the controller
- Use `unique()` and `exists()` helpers for DB validations
- Automatic VineJS error messages
- `confirmed()` for password confirmation
- `exceptId` for updates (don't invalidate the current user)

---

### 6. **Middleware**

**Location:**
- Global: `app/core/middleware/`
- Domain: `app/{domain}/middleware/`

**Named Middleware (in `start/kernel.ts`):**
```typescript
export const middleware = router.named({
  guest: () => import('#core/middleware/guest_middleware'),
  auth: () => import('#core/middleware/auth_middleware'),
})
```

**Structure:**
```typescript
export default class SomeMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Logic before
    await next()
    // Logic after
  }
}
```

**Existing Middleware:**
- `auth`: Protects authenticated routes, redirects to `/login`
- `guest`: Blocks if authenticated, redirects to `/`
- `silentAuth`: Checks without blocking (global, to have `currentUser` everywhere)
- `detectUserLocale`: Detects and applies user's language (user preference > Accept-Language > default EN)
- `container_bindings`: Binds HttpContext and Logger for DI

---

### 7. **Routes**

**Location:** `start/routes.ts`

**Structure:**
```typescript
router
  .group(() => {
    router.get('/login', [LoginController, 'render']).as('auth.login')
    router.post('/login', [LoginController, 'execute'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.get('/profile', [ProfileController, 'render']).as('profile.show')
    router.put('/profile', [ProfileController, 'execute'])
    router.put('/profile/password', [ProfilePasswordController, 'execute'])
    router.delete('/profile', [ProfileDeleteController, 'execute'])
  })
  .prefix('profile')
  .use(middleware.auth())
```

**Naming Conventions:**
- `{domain}.{action}` (e.g., `auth.login`, `profile.update`)
- GET render → `.as('route.name')`
- POST/PUT/DELETE execute → no name (same base)

**Organization:**
- Group by domain
- Apply middleware on the group
- Use `prefix()` if needed
- Dynamically imported controllers

---

### 8. **Helpers**

**Location:**
- Backend: `app/core/helpers/`
- Frontend: `inertia/helpers/`

**Structure:**
```typescript
// Export default for a main helper
export default function mainHelper() {}

// Or named exports for multiple
export function helperOne() {}
export function helperTwo() {}
```

**Existing Helpers (Backend):**
- `validator.ts`: `unique()`, `exists()`, `query()`
- `sleep.ts`: `sleep(time)`

**Existing Helpers (Frontend):**
- `oauth.ts`: `getProviderRoute()`

**i18n Helpers:**
- Backend: `ctx.i18n.t(key, params)` - Translate with interpolation
- Frontend: `useTranslation(namespace)` - React hook for translations

---

### 9. **React Components**

**Location:** `inertia/components/{category}/`

**Categories:**
- `elements/`: Atomic components (Button, NavLink, Panel, FlashMessages)
- `forms/`: Form components (Input, InputGroup, Label)
- `layouts/`: Layouts (AppShell, PageHeader)

**Structure:**
```typescript
interface ButtonProps {
  loading?: boolean
  variant?: "primary" | "accent"
  // ...
}

export function Button(props: ButtonProps) {
  const { loading, variant = "primary" } = props
  
  const classes = `
    base-classes
    ${variant === "primary" ? "primary-classes" : "accent-classes"}
    ${loading ? "loading-classes" : ""}
  `.trim()
  
  return <button className={classes}>{props.children}</button>
}
```

**Conventions:**
- Named export (not default)
- Typed props with interface
- Use SCSS utility classes (no CSS-in-JS)
- Functional components only
- Props destructuring
- Default values in destructuring

---

### 10. **Inertia Pages**

**Location:** `inertia/pages/{domain}/`

**Structure:**
```typescript
import { Head, useForm } from '@inertiajs/react'

interface PageProps {
  someProp: string
}

export default function SomePage(props: PageProps) {
  const form = useForm({
    field: ''
  })
  
  return (
    <>
      <Head title="Page Title" />
      <div className="container">
        {/* Content */}
      </div>
    </>
  )
}
```

**Conventions:**
- Default export (required by Inertia)
- Typed props with interface
- Use Inertia's `useForm` for forms
- `<Head>` for meta tags
- `AppShell` layout applied automatically (unless overridden)
- SCSS utility classes for styling

---

### 11. **Forms (React)**

**Standard Pattern:**
```typescript
const form = useForm({
  email: '',
  password: ''
})

function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  form.post('/route')
}

return (
  <form onSubmit={handleSubmit}>
    <InputGroup
      label="Email"
      name="email"
      type="email"
      value={form.data.email}
      errorMessage={form.errors.email}
      onChange={(e) => form.setData('email', e.target.value)}
      required
    />
    <Button loading={form.processing}>Submit</Button>
  </form>
)
```

**Conventions:**
- `useForm` for state management
- `form.post()` / `form.put()` / `form.delete()`
- `form.processing` for loading state
- `form.errors.{field}` for errors
- `InputGroup` = Label + Input + Error + HelpText
- Real-time visual validation (green/red)

---

## 🎨 Design System (SCSS)

### Structure
```
inertia/assets/scss/
├── abstracts/           # Variables, tokens, mixins
│   ├── _colors.scss    # Complete palette + light/dark themes
│   ├── _typography.scss # Font sizes, weights, families
│   ├── _sizes.scss     # Spacing scale
│   ├── _tokens.scss    # Contextual design tokens
│   ├── _mixins.scss    # Mixins (mq, heading)
│   └── _breakpoints.scss
├── base/               # Reset, root, font-face
├── components/         # Component-specific styles
├── layout/            # Grid, display, position
├── utilities/         # Utility classes
└── app.scss          # Main import
```

### Main Tokens
```scss
// Colors
$color-neutral-{000-1000}
$color-primary-{100-900}
$color-accent-{100-900}

// Typography
$font-family-base: Atkinson-Hyperlegible
$font-size-{300-900}
$font-weight-{default|semi-bold|bold}

// Spacing (0.25rem = 1 unit)
$size-{0-20}  // 0rem to 20rem

// Breakpoints
sm: default (mobile-first)
md: 45em (720px)
lg: 65em (1040px)
```

### Utility Classes
```scss
// Colors
.clr-{color}-{shade}
.bg-{color}-{shade}
.border-{color}-{shade}
.hover:clr-{color}-{shade}

// Spacing
.margin-{size} / .margin-block-{size} / .margin-inline-{size}
.padding-{size} / .padding-block-{size} / .padding-inline-{size}
.gap-{size}

// Typography
.fs-{300-900}
.fw-{bold|regular}
.ff-{base|accent}

// Layout
.display-{block|flex|grid|hidden}
.flex / .flex-column / .flex-wrap
.grid / .grid-auto-fit / .even-columns
.container / .container-narrow / .container-wide

// Position
.relative / .absolute / .fixed / .sticky
.z-{negative|0|10|20|50}

// Width/Height
.w-{full|screen|fit|auto|10-100}
.h-{full|screen|fit|auto}

// Border
.border-radius-{1|2|size}
.border-{0-5}

// Responsive (prefix with md: or lg:)
.md:display-flex
.lg:w-50
```

### Dark Mode
```scss
// Structure present but not activated by default
:root:has(#theme-switcher:checked) {
  // Dark mode variables
}
```

---

## 🗄️ Database

### Naming Conventions
- Tables: `snake_case` plural (users, tokens, remember_me_tokens)
- Columns: `snake_case` (created_at, full_name, github_id)
- Primary key: `id` (auto-increment)
- Foreign key: `{table_singular}_id` (user_id)
- Timestamps: `created_at`, `updated_at`

### Existing Models

**User (users)**
```
id, full_name, email, password, locale,
github_id, google_id, facebook_id,
created_at, updated_at
```

**Token (tokens)**
```
id, user_id, type, token, expires_at,
created_at, updated_at
```

**RememberMeToken (remember_me_tokens)**
```
id, tokenable_id, hash, expires_at,
created_at, updated_at
```

### Relations
- User `hasMany` Token
- User `hasMany` passwordResetTokens (filtered by type)
- Token `belongsTo` User

---

## 🔐 Authentication & Security

### Auth Stack
- **Guard:** `sessionGuard` (cookie-based)
- **Provider:** `sessionUserProvider`
- **Hash:** Scrypt (cost: 16384)
- **Remember Me:** Enabled with DB tokens
- **CSRF:** Shield enabled (POST, PUT, PATCH, DELETE)

### Middleware
- `auth`: Protects routes, redirects to `/login` if not authenticated
- `guest`: Blocks if authenticated, redirects to `/`
- `silentAuth`: Checks without blocking (applied globally)

### OAuth (Ally)
- **Providers:** GitHub, Google, Facebook
- **Config:** `config/ally.ts`
- **Activation:** Via environment variables
- **Flow:**
  1. Redirect to provider
  2. Callback with code
  3. findOrCreateUser (search by provider ID then email)
  4. Auto-link if email exists
  5. Redirect to profile or define-password if needed

### Security
- CSRF protection (Shield)
- XFrame protection (DENY)
- HSTS in production
- Password hashing (Scrypt)
- Expirable tokens (1h for password reset)
- OAuth provider validation

---

## 📧 Emails

### Configuration
- **Service:** @adonisjs/mail
- **Transport:** SMTP (o2Switch)
- **Variables:** SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD

### Existing Emails
- Password reset (link with token)

### Current Structure
- Inline HTML templates in services
- To improve: proper Edge templates

---

## 🌐 i18n (Internationalization)

### Stack
- **Backend:** `@adonisjs/i18n`
- **Frontend:** `react-i18next` + `i18next`
- **Default language:** English (EN)
- **Available languages:** EN, FR
- **Fallback:** EN

### Language Detection Priority

The system detects the user's language in the following order:

1. **User preference** : `users.locale` column (if authenticated)
2. **Accept-Language header** : Browser language detection
3. **Default fallback** : EN

### Translation Files Structure

**Backend (`resources/lang/{locale}/`):**
- `auth.json` : Authentication messages (login, register, reset, OAuth)
- `profile.json` : Profile messages (update, password, delete, locale)
- `emails.json` : Email content (subjects, bodies)
- `validation.json` : VineJS validation messages (optional)

**Frontend (`inertia/locales/{locale}/`):**
- `auth.json` : Auth pages (login, register, forgot, reset, define)
- `profile.json` : Profile page (sections, forms)
- `common.json` : Common UI elements (header, flash, select, language)
- `errors.json` : Error pages (404, 500)

### Usage

**Backend (Controllers/Services):**
```typescript
// In controller with HttpContext
session.flash('success', i18n.t('auth.login.success'))
session.flash('error', i18n.t('auth.social.linked', { provider: 'GitHub' }))
```

**Frontend (React Components):**
```typescript
import { useTranslation } from 'react-i18next'

export default function SomePage() {
  const { t } = useTranslation('auth')
  
  return {t('login.title')}  // "Welcome back!" or "Bon retour!"
}
```

**Multiple Namespaces:**
```typescript
const { t } = useTranslation('auth')
const { t: tCommon } = useTranslation('common')

{t('login.title')}
{tCommon('header.home')}
```

### Email Templates

**Location:** `resources/views/emails/`

Email templates use Edge with inline SCSS for email client compatibility.

**Example:**
```edge
<!-- resources/views/emails/reset_password.edge -->
<!DOCTYPE html>
<html lang="{{ locale }}">
  <body>
    <h1>{{ appName }}</h1>
    <p>{{ greeting }}</p>
    <p>{{ intro }}</p>
    <a href="{{ resetLink }}">{{ action }}</a>
  </body>
</html>
```

Variables are passed from the service:
```typescript
await mail.send((message) => {
  message
    .to(user.email)
    .subject(i18n.t('emails.reset_password.subject'))
    .htmlView('emails/reset_password', {
      locale: user.locale || 'en',
      greeting: i18n.t('emails.reset_password.greeting'),
      intro: i18n.t('emails.reset_password.intro'),
      // ... other variables
    })
})
```

### User Preference Management

Users can change their language preference in their profile settings. The preference is stored in the `users.locale` column.

**When the user updates their profile with a new locale:**
1. The locale is saved to the database
2. The page reloads automatically (`window.location.reload()`)
3. The middleware detects the new locale
4. All content (backend + frontend) is displayed in the new language

### Adding a New Language

To add a new language (e.g., Spanish):

1. Create backend translation files in `resources/lang/es/`
  - `auth.json`
  - `profile.json`
  - `emails.json`

2. Create frontend translation files in `inertia/locales/es/`
  - `auth.json`
  - `profile.json`
  - `common.json`
  - `errors.json`

3. Update `config/i18n.ts`:
```typescript
const i18nConfig = defineConfig({
  defaultLocale: 'en',
  supportedLocales: ['en', 'fr', 'es'],  // Add 'es'
  // ...
})
```

4. Update profile page language selector:
```typescript
options={[
  { label: t_common('language.en'), value: 'en' },
  { label: t_common('language.fr'), value: 'fr' },
  { label: t_common('language.es'), value: 'es' },  // Add Spanish
]}
```

5. Update `ProfileUpdateController` validator:
```typescript
locale: vine.enum(['en', 'fr', 'es']),  // Add 'es'
```

6. Add translations in `common.json` for both languages:
```json
"language": {
  "es": "Español"
}
```

## ⚡ Cache & Redis

### Stack
- **Package:** @adonisjs/redis + ioredis
- **Primary:** Redis (if available)
- **Fallback:** Memory cache (development) or Database (production)
- **Auto-detection:** Automatic Redis availability detection

### CacheService

Centralized service with automatic fallback:
```typescript
import CacheService from '#core/services/cache_service'

const cache = new CacheService()

// Basic operations
await cache.get('key')
await cache.set('key', value, ttlSeconds)
await cache.delete('key')
await cache.has('key')
await cache.flush()

// Numerical operations
await cache.increment('counter', 1, ttlSeconds)
await cache.decrement('counter', 1, ttlSeconds)

// Multiple operations
await cache.getMany(['key1', 'key2'])
await cache.setMany(new Map([['key1', value1], ['key2', value2]]), ttlSeconds)
```

### RateLimitService

Rate limiting service with automatic fallback:
```typescript
import RateLimitService from '#core/services/rate_limit_service'

const limit = new RateLimitService()

const result = await limiter.attempt('login:192.168.1.1', 5, 900) // 5 attempts / 15min

if (!result.allowed) { 
// Rate limit reached 
console.log(`Retry after ${result.retryAfter}s`)
}
```

### Sessions with Redis

Sessions use Redis if available; otherwise, they fall back to cookies:

- **Redis enabled:** Sessions shared between instances, automatic TTL, automatic cleanup
- **Redis disabled:** Sessions in cookies (automatic fallback)

### Configuration
```env
REDIS_ENABLED=false # true to enable Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Helpers
```typescript
import { isRedisAvailable, getRedisConnection } from '#core/helpers/redis'

if (await isRedisAvailable()) {
const redis = await getRedisConnection()
await redis.ping()

}
```

### Cleanup
```bash
# Clean up expired rate limits (to be configured via cron)
node ace cleanup:rate-limits
```


---

## 📄 Queue & Jobs (TO IMPLEMENT)

### Stack
- **Package:** Bull or Bee-Queue
- **Backend:** Redis (with memory fallback)
- **Worker:** Separate process
- **Monitoring:** Bull Board

### Use Cases
- Asynchronous email sending
- Heavy tasks
- Cron jobs (cleanup tokens, sessions, notifications)

---

## 🧪 Tests

### Backend (Japa)
- Location: `tests/` at root
- Command: `node bin/test.ts`
- Separate test DB
- Factories for fixtures

### Frontend (Jest + Testing Library)
- Location: `inertia/__tests__/`
- Command: `npm test`
- Coverage configured

### E2E (Playwright - TO IMPLEMENT)
- Tests for critical flows
- Multi-browser (Chrome, Firefox)

---

## 📦 Build & Deploy

### Development
```bash
npm run dev
```
- Vite HMR enabled
- SSR in dev
- Unoptimized assets

### Production
```bash
npm run build
node bin/server.ts
```
- Optimized and minified assets
- SSR enabled
- Source maps generated

### o2Switch Constraints
- No long-running processes (limited queues)
- Redis available but fallback required
- Cron jobs for recurring tasks
- SSH for deployment

---

## 🎯 General Conventions

### TypeScript
- Strict mode enabled
- Imports with # aliases (#auth/, #core/, #config/, etc.)
- Types exported from modules
- `declare` for class properties

### Async/Await
- Always `async/await` (never `.then()`)
- Try/catch on critical operations
- Logs with `logger` (never `console.log`)

### Flash Messages
- `success`: Successful action
- `error`: Error
- `warning`: Warning
- `info`: Information

### Redirects
```typescript
return response.redirect().toRoute('route.name')
return response.redirect().back()
```

### Logging
```typescript
import logger from '@adonisjs/core/services/logger'

logger.info('Message')
logger.error('Error', { context })
```

---

## ✅ Implemented Features

### Authentication
- ✅ Register with email/password
- ✅ Login with email/password
- ✅ Remember me
- ✅ Logout
- ✅ Forgot password (email with link)
- ✅ Reset password via token
- ✅ Multi-provider OAuth (GitHub, Google, Facebook)
- ✅ Link OAuth accounts
- ✅ Unlink OAuth accounts
- ✅ Define password for OAuth accounts

### Profile
- ✅ Display profile
- ✅ Edit info (email, fullName)
- ✅ Change password
- ✅ Delete account
- ✅ Manage OAuth providers

### Internationalization (i18n)
- ✅ Multi-language support (EN, FR)
- ✅ Automatic language detection (user preference > browser header > default)
- ✅ User language preference saved in database
- ✅ Complete translations (backend + frontend)
- ✅ Multilingual emails with Edge templates
- ✅ VineJS validation messages support
- ✅ Language selector in user profile
- ✅ Automatic page reload on language change
- ✅ Accessible (aria-labels translated)
- ✅ o2Switch compatible

### Infrastructure
- ✅ AdonisJS 6 + Lucid ORM
- ✅ Inertia + React + SSR
- ✅ Vite
- ✅ VineJS validation
- ✅ Shield (CSRF, XFrame, HSTS)
- ✅ Mail (SMTP)
- ✅ Ally (OAuth)

### UI/UX
- ✅ Complete SCSS design system
- ✅ Reusable components
- ✅ Flash messages (toasts)
- ✅ Responsive navigation
- ✅ Complete auth pages
- ✅ Complete profile page
- ✅ Real-time visual validation

### Cache & Redis
- ✅ Redis configuration with retry strategy
- ✅ Cache Service with automatic fallback (Redis → Memory)
- ✅ Rate Limit Service with fallback (Redis → Database)
- ✅ Sessions stored in Redis (with fallback cookies)
- ✅ Automatic Redis availability detection
- ✅ Cleanup command for expired rate limits
- ✅ o2Switch compatible (graceful degradation)

---

## 🚀 To Implement (Priorities)

### High Priority
1. Rate limiting
2. Email verification
3. Secure password reset tokens
4. Role and permission system
5. i18n (backend + frontend)
6. Redis with fallback
7. Queue system
8. Database notifications
9. Tests (setup + unit + integration)
10. CI/CD (GitHub Actions)

### Medium Priority
11. Functional dark mode
12. Real-time notifications (SSE)
13. Professional email templates
14. Optional 2FA
15. Accessibility improvements
16. Complete documentation

### Low Priority
17. User avatar
18. Data export (GDPR)
19. Feature flags
20. Admin dashboard

---

## 📚 Resources

### Documentation
- AdonisJS: https://docs.adonisjs.com
- Inertia: https://inertiajs.com
- Lucid ORM: https://lucid.adonisjs.com
- VineJS: https://vinejs.dev

### Useful Commands
```bash
# Development
npm run dev

# Build
npm run build

# Tests
node bin/test.ts

# Migrations
node ace migration:run
node ace migration:rollback

# Create user
node ace create:user email@example.com

# Console (Tinker)
node ace repl
```
