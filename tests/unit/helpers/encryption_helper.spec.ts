import { test } from '@japa/runner'
import { createEncryptionHelper } from '#core/helpers/encryption'
import { writeFile, readFile, rm, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import env from '#start/env'

test.group('EncryptionHelper', (group) => {
  const helper = createEncryptionHelper(env.get('APP_KEY'))
  const testDir = 'storage/test-encryption'

  group.setup(async () => {
    await mkdir(testDir, { recursive: true })
  })

  group.teardown(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test('encryptFile: should encrypt a file', async ({ assert }) => {
    const inputPath = `${testDir}/plain.txt`
    const outputPath = `${testDir}/encrypted.txt.enc`

    await writeFile(inputPath, 'Secret content to encrypt')

    await helper.encryptFile(inputPath, outputPath)

    assert.isTrue(existsSync(outputPath))

    const encrypted = await readFile(outputPath)
    const plain = await readFile(inputPath, 'utf-8')

    assert.notEqual(encrypted.toString(), plain)
  })

  test('decryptFile: should decrypt an encrypted file', async ({ assert }) => {
    const inputPath = `${testDir}/original.txt`
    const encryptedPath = `${testDir}/encrypted.enc`
    const decryptedPath = `${testDir}/decrypted.txt`

    const originalContent = 'Original secret content'
    await writeFile(inputPath, originalContent)

    await helper.encryptFile(inputPath, encryptedPath)

    await helper.decryptFile(encryptedPath, decryptedPath)

    const decryptedContent = await readFile(decryptedPath, 'utf-8')

    assert.equal(decryptedContent, originalContent)
  })

  test('encrypt: should encrypt buffer data', async ({ assert }) => {
    const plainData = Buffer.from('Test data')

    const encrypted = helper.encrypt(plainData)

    assert.instanceOf(encrypted, Buffer)
    assert.notEqual(encrypted.toString(), plainData.toString())
    assert.isTrue(encrypted.length > plainData.length)
  })

  test('decrypt: should decrypt buffer data', async ({ assert }) => {
    const plainData = Buffer.from('Test data to encrypt')

    const encrypted = helper.encrypt(plainData)
    const decrypted = helper.decrypt(encrypted)

    assert.equal(decrypted.toString(), plainData.toString())
  })

  test('encrypt/decrypt: should handle string data', async ({ assert }) => {
    const plainText = 'Secret message'

    const encrypted = helper.encrypt(plainText)
    const decrypted = helper.decrypt(encrypted)

    assert.equal(decrypted.toString(), plainText)
  })

  test('encrypt: should produce different ciphertext for same plaintext', async ({ assert }) => {
    const plainText = 'Same content'

    const encrypted1 = helper.encrypt(plainText)
    const encrypted2 = helper.encrypt(plainText)

    assert.notEqual(encrypted1.toString('hex'), encrypted2.toString('hex'))

    const decrypted1 = helper.decrypt(encrypted1)
    const decrypted2 = helper.decrypt(encrypted2)

    assert.equal(decrypted1.toString(), plainText)
    assert.equal(decrypted2.toString(), plainText)
  })

  test('encryptFile: should handle large files', async ({ assert }) => {
    const inputPath = `${testDir}/large.txt`
    const outputPath = `${testDir}/large.enc`

    const largeContent = 'x'.repeat(1024 * 1024)
    await writeFile(inputPath, largeContent)

    await helper.encryptFile(inputPath, outputPath)

    assert.isTrue(existsSync(outputPath))

    const stats = await import('node:fs/promises').then((fs) => fs.stat(outputPath))
    assert.isTrue(stats.size > largeContent.length)
  })

  test('decryptFile: should handle corrupted encrypted data', async ({ assert }) => {
    const encryptedPath = `${testDir}/corrupted.enc`
    const decryptedPath = `${testDir}/corrupted-output.txt`

    await writeFile(encryptedPath, 'not encrypted data')

    await assert.rejects(async () => helper.decryptFile(encryptedPath, decryptedPath))
  })

  test('decrypt: should fail with invalid encrypted data', async ({ assert }) => {
    const invalidData = Buffer.from('invalid encrypted data')

    assert.throws(() => helper.decrypt(invalidData))
  })

  test('edge case: encrypt empty string', async ({ assert }) => {
    const encrypted = helper.encrypt('')
    const decrypted = helper.decrypt(encrypted)

    assert.equal(decrypted.toString(), '')
  })

  test('edge case: encrypt binary data', async ({ assert }) => {
    const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd])

    const encrypted = helper.encrypt(binaryData)
    const decrypted = helper.decrypt(encrypted)

    assert.deepEqual(decrypted, binaryData)
  })

  test('security: encrypted data should not reveal plaintext length', async ({ assert }) => {
    const short = helper.encrypt('Hi')
    const long = helper.encrypt('This is a much longer message that should still be encrypted')

    assert.isTrue(short.length > 16)
    assert.isTrue(long.length > short.length)
  })

  test('consistency: multiple encrypt/decrypt cycles', async ({ assert }) => {
    let data = Buffer.from('Initial content')

    for (let i = 0; i < 5; i++) {
      const encrypted = helper.encrypt(data)
      data = helper.decrypt(encrypted) as Buffer<ArrayBuffer>
    }

    assert.equal(data.toString(), 'Initial content')
  })

  test('performance: encryption should be reasonably fast', async ({ assert }) => {
    const testData = 'x'.repeat(10000)

    const startTime = Date.now()
    for (let i = 0; i < 100; i++) {
      helper.encrypt(testData)
    }
    const duration = Date.now() - startTime

    assert.isTrue(duration < 1000)
  })
})
