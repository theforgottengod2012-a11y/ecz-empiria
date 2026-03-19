const mongoose = require("mongoose");

const ModTrackerSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },

  // ── Counting & display ────────────────────────────────────────────────────
  generalChannelId: { type: String, default: null },   // Where messages are counted
  historyChannelId: { type: String, default: null },   // Where daily summaries are posted
  staffChatChannelId: { type: String, default: null }, // Where demotion confirmations are posted

  // ── Role hierarchy (highest → lowest) ────────────────────────────────────
  staffRoleIds: { type: [String], default: [] },

  // ── Role display channels ─────────────────────────────────────────────────
  roleChannels: [
    {
      roleId:    { type: String, required: true },
      channelId: { type: String, required: true },
      messageId: { type: String, default: null },
    }
  ],

  // ── Demotion system config ────────────────────────────────────────────────
  demotionEnabled:      { type: Boolean, default: false },
  minDailyMessages:     { type: Number,  default: 250  },
  failDaysThreshold:    { type: Number,  default: 3    },
  confirmationRoleIds:  { type: [String], default: []  },

  // ── Offline backfill — last processed Discord message ID in general channel ─
  lastSeenMessageId:    { type: String,  default: null },

}, { timestamps: true });

module.exports = mongoose.model("ModTracker", ModTrackerSchema);
