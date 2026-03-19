const mongoose = require("mongoose");

const reactionRoleSchema = new mongoose.Schema({
  guildId: String,
  messageId: String,
  channelId: String,
  roles: [
    {
      emoji: String,
      roleId: String,
      label: String
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ReactionRole", reactionRoleSchema);
