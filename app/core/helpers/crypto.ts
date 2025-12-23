import { randomBytes as nodeRandomBytes } from 'node:crypto'

/**
 * Generate cryptographically secure random string
 */
export function randomBytes(length: number): string {
  return nodeRandomBytes(length).toString('hex')
}

/**
 * Generate cryptographically secure random token
 * Default: 64 bytes = 128 hex characters
 */
export function generateToken(bytes: number = 64): string {
  return randomBytes(bytes)
}

/**
 * Mask token for logging (show only first 10 characters)
 */
export function maskToken(token: string, visibleChars: number = 10): string {
  if (token.length <= visibleChars) return '***'
  return `${token.substring(0, visibleChars)}***`
}
