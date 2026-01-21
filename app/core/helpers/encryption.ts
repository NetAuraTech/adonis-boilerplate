import crypto from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import type { ReadStream, WriteStream } from 'node:fs'

/**
 * Encryption helper for backup files
 * Uses AES-256-CBC with APP_KEY
 */
export class EncryptionHelper {
  private algorithm = 'aes-256-cbc'
  private readonly key: Buffer
  private ivLength = 16

  constructor(appKey: string) {
    this.key = crypto.scryptSync(appKey, 'salt', 32)
  }

  /**
   * Encrypt a file
   *
   * @param inputPath - Path to input file
   * @param outputPath - Path to output encrypted file
   */
  async encryptFile(inputPath: string, outputPath: string): Promise<void> {
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)

    const input: ReadStream = createReadStream(inputPath)
    const output: WriteStream = createWriteStream(outputPath)

    output.write(iv)

    await pipeline(input, cipher, output)
  }

  /**
   * Decrypt a file
   *
   * @param inputPath - Path to encrypted file
   * @param outputPath - Path to output decrypted file
   */
  async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    const { readFile, writeFile } = await import('node:fs/promises')

    // Read encrypted file
    const encryptedData = await readFile(inputPath)

    // Extract IV (first 16 bytes)
    const iv = encryptedData.subarray(0, this.ivLength)
    const encrypted = encryptedData.subarray(this.ivLength)

    // Decrypt
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

    // Write decrypted file
    await writeFile(outputPath, decrypted)
  }

  /**
   * Encrypt data (buffer or string)
   *
   * @param data - Data to encrypt
   * @returns Encrypted data with IV prepended
   */
  encrypt(data: Buffer | string): Buffer {
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)

    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8')
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])

    return Buffer.concat([iv, encrypted])
  }

  /**
   * Decrypt data
   *
   * @param data - Encrypted data with IV prepended
   * @returns Decrypted data
   */
  decrypt(data: Buffer): Buffer {
    const iv = data.subarray(0, this.ivLength)
    const encrypted = data.subarray(this.ivLength)

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
    return Buffer.concat([decipher.update(encrypted), decipher.final()])
  }
}

/**
 * Create encryption helper instance with APP_KEY
 */
export function createEncryptionHelper(appKey: string): EncryptionHelper {
  return new EncryptionHelper(appKey)
}
