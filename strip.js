const { PermissionFlagsBits } = require("discord.js");
const { resolveMember } = require("../../utils/resolver");

module.exports = {
  name: "strip",
  description: "Remove all staff/manage roles from a member",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply("❌ Only administrators can use this.");
    }

    const member = await resolveMember(message, args[0]);
    if (!member) return message.reply("❌ Usage: `$strip <@member|ID>`");

    const staffPerms = [
      PermissionFlagsBits.Administrator,
      PermissionFlagsBits.ManageGuild,
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.ModerateMembers
    ];

    const rolesToRemove = member.roles.cache.filter(role => 
      role.name !== "@everyone" && 
      staffPerms.some(perm => role.permissions.has(perm)) &&
      role.position < message.guild.members.me.roles.highest.position
    );

    if (rolesToRemove.size === 0) return message.reply("❌ This member has no removable staff roles.");

    try {
      await member.roles.remove(rolesToRemove);
      message.reply(`🧹 Stripped **${rolesToRemove.size}** staff roles from **${member.user.tag}**.`);
    } catch (err) {
      message.reply("❌ Failed to strip roles.");
    }
  }
};
