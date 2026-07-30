const mongoose = require('mongoose');

// Append-only audit trail for security-relevant actions — never stores
// passwords, tokens, or captcha answers, only enough metadata to support
// auditing/incident response (who, what, from where, when).
const securityEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    email: { type: String, trim: true }, // captured even when there's no user match (e.g. unknown-email login attempt)
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

securityEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
