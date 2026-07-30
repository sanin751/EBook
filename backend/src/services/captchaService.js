// Self-hosted CAPTCHA (svg-captcha) rather than a third-party widget
// (reCAPTCHA/hCaptcha/Turnstile) — those require a registered public domain
// and site key, which doesn't work for a localhost coursework demo. Trade-off
// noted for the report: this in-memory store doesn't survive a restart and
// wouldn't scale across multiple server instances without a shared store
// (Redis) — acceptable for this coursework's single-instance scope.
const crypto = require('crypto');
const svgCaptcha = require('svg-captcha');

const TTL_MS = 5 * 60 * 1000;
const store = new Map(); // captchaId -> { text, expiresAt }

function cleanupExpired() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expiresAt < now) store.delete(id);
  }
}

const cleanupTimer = setInterval(cleanupExpired, 60 * 1000);
cleanupTimer.unref();

function generate() {
  const captcha = svgCaptcha.create({
    size: 5,
    noise: 3,
    color: true,
    background: '#f4f1ee',
    ignoreChars: '0oO1ilI',
  });
  const captchaId = crypto.randomUUID();
  store.set(captchaId, { text: captcha.text.toLowerCase(), expiresAt: Date.now() + TTL_MS });
  return { captchaId, svg: captcha.data };
}

function verify(captchaId, submittedText) {
  if (!captchaId) return false;
  const entry = store.get(captchaId);
  store.delete(captchaId);
  if (!entry || entry.expiresAt < Date.now()) return false;
  return String(submittedText || '').trim().toLowerCase() === entry.text;
}

module.exports = { generate, verify };

// Test-only escape hatch so Jest can read the generated answer without an
// OCR step — never present outside NODE_ENV=test, and the app itself never
// imports this key.
if (process.env.NODE_ENV === 'test') {
  module.exports._store = store;
}
