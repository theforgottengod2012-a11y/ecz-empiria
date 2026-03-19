const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema({
  guildId: String,
  caseId: Number,
  userId: String,
  moderatorId: String,
  action: String, // ban, kick, warn, mute, timeout
  reason: String,
  duration: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Case", caseSchema);
