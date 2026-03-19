const mongoose = require("mongoose");

const levelingSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  totalXp: { type: Number, default: 0 },
  messageXp: { type: Number, default: 0 },
  voiceXp: { type: Number, default: 0 }
});

module.exports = mongoose.model("Leveling", levelingSchema);
