const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  welcomeChannel: { type: String, default: null },
  welcomeMessage: { type: String, default: "Welcome {user} to {server}!" },
  verificationEnabled: { type: Boolean, default: false },
  autorole: { type: String, default: null },
  antiNuke: { type: Boolean, default: true },
  whitelist: { type: Array, default: [] }, // userIds safe from anti-nuke
  logsChannel: { type: String, default: null }, // where actions are logged
});

module.exports = mongoose.model("GuildSettings", guildSchema);