const mongoose = require("mongoose");

const PendingDemotionSchema = new mongoose.Schema({
  guildId:      { type: String, required: true },
  userId:       { type: String, required: true },
  currentRoleId: { type: String, required: true },   // Role they currently hold
  targetRoleId:  { type: String, default: null },    // null = full demotion to member

  // Discord message tracking
  channelId:  { type: String, default: null },
  messageId:  { type: String, default: null },

  // Status
  status:    { type: String, default: "pending" },  // pending | confirmed | cancelled
  decidedBy: { type: String, default: null },        // userId who confirmed/cancelled

  expiresAt: { type: Date, default: () => new Date(Date.now() + 48 * 3600 * 1000) },
  createdAt: { type: Date, default: Date.now },
});

PendingDemotionSchema.index({ guildId: 1, userId: 1, status: 1 });
module.exports = mongoose.model("PendingDemotion", PendingDemotionSchema);
