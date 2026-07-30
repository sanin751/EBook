const mongoose = require('mongoose');

const blockedIpSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, unique: true, trim: true },
    reason: { type: String, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // absent for auto-blocks triggered by the rate limiter, set for admin-added blocks
    },
    // MongoDB TTL index: the document (and therefore the block) is
    // automatically removed once expiresAt passes — no separate cleanup job.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlockedIp', blockedIpSchema);
