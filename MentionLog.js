const mongoose = require("mongoose");

const MentionLogSchema = new mongoose.Schema({
  guildId:     { type: String, required: true },
  guildName:   { type: String, default: "Unknown" },
  channelId:   { type: String, required: true },
  channelName: { type: String, default: "Unknown" },
  userId:      { type: String, required: true },
  username:    { type: String, default: "Unknown" },
  displayName: { type: String, default: null },
  avatarUrl:   { type: String, default: null },
  content:     { type: String, required: true },
  messageId:   { type: String, required: true },
  messageUrl:  { type: String, default: null },
  context:     { type: String, default: null },
  read:        { type: Boolean, default: false },
  timestamp:   { type: Date, default: Date.now },
}, { timestamps: true });

MentionLogSchema.index({ timestamp: -1 });
MentionLogSchema.index({ read: 1 });

module.exports = mongoose.model("MentionLog", MentionLogSchema);
