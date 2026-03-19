const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "lockdown_channel",
  aliases: ["lock"],
  description: "Lock the current channel",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply("❌ You need `Manage Channels` permission.");
    }

    try {
      await message.channel.permissionOverwrites.edit(message.guild.id, {
        SendMessages: false
      });
      message.reply("🔒 Channel locked.");
    } catch (err) {
      message.reply("❌ Failed to lock channel.");
    }
  }
};
