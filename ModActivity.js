const mongoose = require("mongoose");

const ModActivitySchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId:  { type: String, required: true },

  // ── Today's counters (reset at midnight) ──────────────────────────────────
  todayMessages:      { type: Number, default: 0 },
  todayOnlineSeconds: { type: Number, default: 0 },

  // ── All-time counters (never reset) ───────────────────────────────────────
  totalMessages:      { type: Number, default: 0 },
  totalOnlineSeconds: { type: Number, default: 0 },

  // ── Presence tracking ─────────────────────────────────────────────────────
  sessionStart:  { type: Date,   default: null },
  currentStatus: { type: String, default: "offline" },

  // ── Timestamps ────────────────────────────────────────────────────────────
  lastSeen:    { type: Date, default: null },
  lastMessage: { type: Date, default: null },
  lastReset:   { type: Date, default: null },

  // ── Demotion tracking ─────────────────────────────────────────────────────
  consecutiveFailDays: { type: Number, default: 0 },   // Consecutive days below minimum
  pendingDemotion:     { type: Boolean, default: false },

  // ── Daily history (last 30 days) ──────────────────────────────────────────
  dailyHistory: [
    {
      date:          { type: String  },  // "YYYY-MM-DD"
      messages:      { type: Number, default: 0 },
      onlineSeconds: { type: Number, default: 0 },
      metRequirement:{ type: Boolean, default: false },
    }
  ],
});

ModActivitySchema.index({ guildId: 1, userId: 1 }, { unique: true });
module.exports = mongoose.model("ModActivity", ModActivitySchema);
