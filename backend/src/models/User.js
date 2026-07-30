const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [10, 'Password must be at least 10 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordlessToken: String,
    passwordlessTokenExpires: Date,
    // Reused across the last few hashes so a user can't immediately reuse a
    // just-retired password; capped at 5 in the pre-save hook below.
    passwordHistory: {
      type: [String],
      select: false,
      default: [],
    },
    passwordExpiresAt: Date,
    // Account-lockout brute-force defense, independent of the IP-based rate
    // limiter (protects against distributed/low-and-slow credential attacks
    // against a single account).
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    // Bumped on logout and on password change to invalidate every
    // outstanding refresh token at once (the refresh JWT carries the version
    // it was issued with, checked in authService.refresh).
    tokenVersion: {
      type: Number,
      default: 0,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    // AES-256-GCM ciphertext (see utils/crypto.js) — never stored in plaintext.
    mfaSecret: {
      type: String,
      select: false,
    },
    mfaBackupCodes: {
      type: [String],
      select: false,
      default: [],
    },
  },
  { timestamps: true }
);

const PASSWORD_HISTORY_LIMIT = 5;
const PASSWORD_EXPIRY_DAYS = 90;

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;

  // Capture the CURRENT (pre-hash) hash from the DB before overwriting it,
  // so it can be pushed onto history — only relevant when this isn't a new
  // document (a brand-new user has no prior password to remember).
  if (!this.isNew) {
    const existing = await this.constructor.findById(this._id).select('+password +passwordHistory');
    if (existing?.password) {
      this.passwordHistory = [existing.password, ...(existing.passwordHistory || [])].slice(
        0,
        PASSWORD_HISTORY_LIMIT
      );
    }
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordExpiresAt = new Date(Date.now() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isPasswordReused = async function isPasswordReused(candidate) {
  if (this.password && (await bcrypt.compare(candidate, this.password))) return true;
  for (const oldHash of this.passwordHistory || []) {
    if (await bcrypt.compare(candidate, oldHash)) return true;
  }
  return false;
};

userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtTimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return jwtTimestamp < changedTimestamp;
};

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.passwordHistory;
  delete obj.mfaSecret;
  delete obj.mfaBackupCodes;
  delete obj.failedLoginAttempts;
  delete obj.lockUntil;
  delete obj.tokenVersion;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
