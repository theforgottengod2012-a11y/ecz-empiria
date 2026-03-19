const mongoose = require("mongoose");

const GuildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix:  { type: String, default: "$", maxlength: 5 },
}, { timestamps: true });

module.exports = mongoose.model("GuildConfig", GuildConfigSchema);
