const { PermissionFlagsBits } = require("discord.js");
const { resolveMember } = require("../../utils/resolver");

module.exports = {
  name: "nick",
  aliases: ["nickname"],
  description: "Change a member's nickname",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return message.reply("❌ You need `Manage Nicknames` permission.");
    }

    const member = await resolveMember(message, args[0]);
    const nick = args.slice(1).join(" ");

    if (!member) return message.reply("❌ Usage: `$nick <@member|ID> <new nickname>`");

    try {
      await member.setNickname(nick || null);
      message.reply(`✅ Nickname for **${member.user.tag}** ${nick ? `set to **${nick}**` : "cleared"}.`);
    } catch (err) {
      message.reply("❌ Failed to change nickname. Hierarchy or permission issue.");
    }
  }
};
