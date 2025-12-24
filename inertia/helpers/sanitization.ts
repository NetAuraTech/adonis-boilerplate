/**
 * Sanitization options
 */
export interface SanitizationOptions {
  /**
   * Strip HTML tags
   */
  stripHtml?: boolean

  /**
   * Trim whitespace
   */
  trim?: boolean

  /**
   * Convert to lowercase
   */
  lowercase?: boolean

  /**
   * Remove multiple spaces
   */
  removeMultipleSpaces?: boolean
}

/**
 * Default sanitization options
 */
const DEFAULT_OPTIONS: SanitizationOptions = {
  stripHtml: true,
  trim: true,
  lowercase: false,
  removeMultipleSpaces: true,
}

/**
 * Strip HTML tags from string
 */
function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, '')
}

/**
 * Remove multiple consecutive spaces
 */
function removeMultipleSpaces(value: string): string {
  return value.replace(/\s+/g, ' ')
}

/**
 * Sanitize a string value
 */
export function sanitize(value: string, options: SanitizationOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let sanitized = value

  if (opts.stripHtml) {
    sanitized = stripHtmlTags(sanitized)
  }

  if (opts.trim) {
    sanitized = sanitized.trim()
  }

  if (opts.lowercase) {
    sanitized = sanitized.toLowerCase()
  }

  if (opts.removeMultipleSpaces) {
    sanitized = removeMultipleSpaces(sanitized)
  }

  return sanitized
}

/**
 * Sanitize email (trim + lowercase)
 */
export function sanitizeEmail(value: string): string {
  return sanitize(value, {
    stripHtml: false,
    trim: true,
    lowercase: true,
    removeMultipleSpaces: false,
  })
}

/**
 * Sanitize text input (strip HTML + trim)
 */
export function sanitizeText(value: string): string {
  return sanitize(value, {
    stripHtml: true,
    trim: true,
    lowercase: false,
    removeMultipleSpaces: true,
  })
}

/**
 * No sanitization (for passwords, etc.)
 */
export function noSanitization(value: string): string {
  return value
}
