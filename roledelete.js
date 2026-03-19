const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "roledelete",
  description: "Delete a role from the server",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply("❌ You need `Manage Roles` permission to use this.");
    }

    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if (!role) return message.reply("❌ Usage: `$roledelete <@role | role_id>`");

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply("❌ This role is higher or equal to my highest role.");
    }

    try {
      await role.delete(`Deleted by ${message.author.tag}`);
      message.reply(`✅ Successfully deleted role: **${role.name}**`);
    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to delete role.");
    }
  }
};
