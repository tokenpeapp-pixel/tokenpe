import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

/**
 * Returns the encryption key from environment variable as a Buffer.
 * Throws if the key is missing or invalid.
 */
function getEncryptionKey() {
    const keyString = process.env.RAZORPAY_ENCRYPTION_KEY
    if (!keyString || keyString.length !== 32) {
        throw new Error('RAZORPAY_ENCRYPTION_KEY must be exactly 32 bytes')
    }
    return Buffer.from(keyString, 'utf8')
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a hex string in the format: iv:authTag:encryptedData
 */
export function encryptRazorpaySecret(plaintext) {
    if (!plaintext) return null

    const key = getEncryptionKey()
    const iv = crypto.randomBytes(12) // GCM standard IV size is 12 bytes
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypts a hex string in the format: iv:authTag:encryptedData
 * Returns the original plaintext.
 */
export function decryptRazorpaySecret(encryptedString) {
    if (!encryptedString) return null

    const parts = encryptedString.split(':')
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted string format. Expected iv:authTag:encryptedData')
    }

    const [ivHex, authTagHex, encryptedHex] = parts
    const key = getEncryptionKey()
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}
