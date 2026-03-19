const { PermissionFlagsBits } = require("discord.js");
const { resolveMember } = require("../../utils/resolver");

module.exports = {
  name: "untimeout",
  aliases: ["unmute"],
  description: "Remove timeout from a member",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("❌ You need `Moderate Members` permission.");
    }

    const member = await resolveMember(message, args[0]);
    if (!member) return message.reply("❌ Usage: `$untimeout <@member|ID>`");

    try {
      await member.timeout(null);
      message.reply(`✅ Removed timeout from **${member.user.tag}**.`);
    } catch (err) {
      message.reply("❌ Failed to remove timeout.");
    }
  }
};
