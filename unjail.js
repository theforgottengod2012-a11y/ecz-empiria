const { PermissionFlagsBits } = require("discord.js");
const { resolveMember } = require("../../utils/resolver");

module.exports = {
  name: "unjail",
  description: "Unjail a member",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("❌ You need `Moderate Members` permission.");
    }

    const member = await resolveMember(message, args[0]);
    if (!member) return message.reply("❌ Usage: `$unjail <@member|ID>`");

    const jailRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === "jailed");
    if (!jailRole) return message.reply("❌ No 'Jailed' role found in this server.");

    try {
      await member.roles.remove(jailRole);
      message.reply(`🔓 **${member.user.tag}** has been unjailed.`);
    } catch (err) {
      message.reply("❌ Failed to unjail member.");
    }
  }
};
