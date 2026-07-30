const { authenticator } = require('otplib');
const qrcode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fieldCrypto = require('../utils/crypto');

const ISSUER = 'EBook';
const BACKUP_CODE_COUNT = 10;

function generateSecret() {
  return authenticator.generateSecret();
}

function keyUri(email, secret) {
  return authenticator.keyuri(email, ISSUER, secret);
}

function qrCodeDataUrl(otpauthUrl) {
  return qrcode.toDataURL(otpauthUrl);
}

function verifyToken(secret, token) {
  if (!token) return false;
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

// e.g. "A1B2C-D3E4F" — readable in groups, case-insensitive on submit.
function generateBackupCodes() {
  return Array.from({ length: BACKUP_CODE_COUNT }, () => {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
  });
}

function hashBackupCodes(codes) {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

// Single-use: removes the matched hash from the list on success so it can't
// be replayed. Returns whether a match was found (caller is responsible for
// persisting the mutated `user.mfaBackupCodes`).
async function consumeBackupCode(user, submittedCode) {
  const hashes = user.mfaBackupCodes || [];
  const normalized = String(submittedCode || '').trim().toUpperCase();
  for (let i = 0; i < hashes.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(normalized, hashes[i])) {
      user.mfaBackupCodes = [...hashes.slice(0, i), ...hashes.slice(i + 1)];
      return true;
    }
  }
  return false;
}

module.exports = {
  generateSecret,
  keyUri,
  qrCodeDataUrl,
  verifyToken,
  generateBackupCodes,
  hashBackupCodes,
  consumeBackupCode,
  encryptSecret: fieldCrypto.encrypt,
  decryptSecret: fieldCrypto.decrypt,
};
