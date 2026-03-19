const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "unlock_channel",
  aliases: ["unlock"],
  description: "Unlock the current channel",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply("❌ You need `Manage Channels` permission.");
    }

    try {
      await message.channel.permissionOverwrites.edit(message.guild.id, {
        SendMessages: null
      });
      message.reply("🔓 Channel unlocked.");
    } catch (err) {
      message.reply("❌ Failed to unlock channel.");
    }
  }
};
