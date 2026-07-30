// Field-level encryption for data more sensitive than "just PII" (e.g. a
// live MFA secret) — AES-256-GCM, authenticated so tampering with the
// ciphertext is detected on decrypt rather than silently producing garbage.
//
// Key management: for this coursework the key is a single 256-bit value from
// FIELD_ENCRYPTION_KEY (hex-encoded, generated once with
// `crypto.randomBytes(32).toString('hex')`), loaded via env like every other
// secret in this app. A production deployment would source this from a KMS
// (AWS KMS/GCP KMS/Vault) with rotation support instead of a static env var —
// noted here rather than built, since that's an infrastructure concern, not
// an application-code one.
const crypto = require('crypto');
const env = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended IV length for GCM

function getKey() {
  const hex = env.fieldEncryptionKey;
  if (!hex) throw new Error('FIELD_ENCRYPTION_KEY is not configured');
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) throw new Error('FIELD_ENCRYPTION_KEY must be a 32-byte (64 hex character) value');
  return key;
}


function encrypt(plaintext) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':');
}

function decrypt(payload) {
  const [ivHex, authTagHex, ciphertextHex] = String(payload).split(':');
  if (!ivHex || !authTagHex || !ciphertextHex) throw new Error('Malformed encrypted payload');

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextHex, 'hex')), decipher.final()]);
  return plaintext.toString('utf8');
}

module.exports = { encrypt, decrypt };
