const mongoose = require("mongoose");

const DMMessageSchema = new mongoose.Schema({
  messageId:  { type: String, required: true },
  content:    { type: String, required: true },
  fromBot:    { type: Boolean, default: false },
  authorName: { type: String, default: "User" },
  timestamp:  { type: Date, default: Date.now },
});

const DMLogSchema = new mongoose.Schema({
  userId:      { type: String, required: true, unique: true },
  username:    { type: String, default: "Unknown" },
  avatarUrl:   { type: String, default: null },
  messages:    { type: [DMMessageSchema], default: [] },
  lastMessage: { type: String, default: "" },
  lastMessageAt: { type: Date, default: Date.now },
  unread:      { type: Boolean, default: true },
}, { timestamps: true });

// Index for faster queries
DMLogSchema.index({ userId: 1 });
DMLogSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("DMLog", DMLogSchema);
