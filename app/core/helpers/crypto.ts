import { randomBytes } from 'node:crypto'

/**
 * Generate a random token string
 * @param length - Length of the token in bytes (default: 32, will be 64 characters in hex)
 * @returns Random hex string
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Generate a selector/validator token pair
 *
 * The selector is stored in plain text in the database for efficient lookup,
 * while the validator is hashed for security. Together they form a secure token.
 *
 * @param selectorLength - Length of the selector in bytes (default: 32)
 * @param validatorLength - Length of the validator in bytes (default: 32)
 * @returns Object containing selector, validator, and fullToken (format: "selector.validator")
 *
 * @example
 * const { selector, validator, fullToken } = generateSplitToken()
 * // selector: "abc123..." (stored in DB as-is)
 * // validator: "def456..." (hashed before storage)
 * // fullToken: "abc123....def456..." (sent to user)
 */
export function generateSplitToken(selectorLength: number = 32, validatorLength: number = 32) {
  const selector = generateToken(selectorLength)
  const validator = generateToken(validatorLength)
  const fullToken = `${selector}.${validator}`

  return { selector, validator, fullToken }
}

/**
 * Split a full token into selector and validator parts
 *
 * @param fullToken - The complete token in format "selector.validator"
 * @returns Object with selector and validator, or null if format is invalid
 *
 * @example
 * const parts = splitToken("abc123.def456")
 * // { selector: "abc123", validator: "def456" }
 *
 * const invalid = splitToken("invalid-token")
 * // null
 */
export function splitToken(fullToken: string): { selector: string; validator: string } | null {
  const parts = fullToken.split('.')

  if (parts.length !== 2) {
    return null
  }

  const [selector, validator] = parts

  if (!selector || !validator) {
    return null
  }

  return { selector, validator }
}

/**
 * Mask a token for safe logging
 *
 * Shows only the first 8 and last 4 characters of the token,
 * masking the rest with asterisks. Useful for logging without
 * exposing the full token value.
 *
 * @param token - The token to mask (can be full token or selector)
 * @returns Masked token string
 *
 * @example
 * maskToken("abc123def456ghi789jkl012.mno345pqr678stu901vwx234")
 * // "abc123de********x234"
 *
 * maskToken("short")
 * // "short"
 */
export function maskToken(token: string): string {
  if (token.length <= 12) {
    return token
  }

  const start = token.slice(0, 8)
  const end = token.slice(-4)
  const masked = '*'.repeat(Math.min(token.length - 12, 20))

  return `${start}${masked}${end}`
}
