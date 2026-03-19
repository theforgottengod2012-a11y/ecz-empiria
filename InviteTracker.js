const mongoose = require("mongoose");

const inviteTrackerSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  inviter: String,
  code: String,
  timestamp: { type: Date, default: Date.now },
  fake: { type: Boolean, default: false }
});

module.exports = mongoose.model("InviteTracker", inviteTrackerSchema);
