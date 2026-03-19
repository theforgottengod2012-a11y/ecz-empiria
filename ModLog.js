const mongoose = require("mongoose");

const modLogSchema = new mongoose.Schema({
  guildId: String,
  channelId: { type: String, default: null },
  userId: String,
  action: String, // warn, kick, ban, timeout, crime, heal, mute, etc.
  reason: String,
  target: { type: String, default: null }, // who was affected
  details: { type: Object, default: {} }, // additional data
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ModLog", modLogSchema);
