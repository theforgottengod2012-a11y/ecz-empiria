const { PermissionFlagsBits } = require("discord.js");
const { resolveMember, resolveRole } = require("../../utils/resolver");

module.exports = {
  name: "removerole",
  description: "Remove a role from a member",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply("❌ You need `Manage Roles` permission.");
    }

    const member = await resolveMember(message, args[0]);
    const role = resolveRole(message, args.slice(1).join(" "));

    if (!member || !role) return message.reply("❌ Usage: `$removerole <@member|ID> <@role|ID|name>`");

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply("❌ I cannot manage this role due to hierarchy.");
    }

    try {
      await member.roles.remove(role);
      message.reply(`✅ Removed role **${role.name}** from **${member.user.tag}**.`);
    } catch (err) {
      message.reply("❌ Failed to remove role.");
    }
  }
};
