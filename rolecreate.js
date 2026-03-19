const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "rolecreate",
  description: "Create a new role in the server",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply("❌ You need `Manage Roles` permission to use this.");
    }

    const name = args.join(" ");
    if (!name) return message.reply("❌ Usage: `$rolecreate <name>`");

    try {
      const role = await message.guild.roles.create({
        name,
        reason: `Role created by ${message.author.tag}`
      });
      message.reply(`✅ Successfully created role: **${role.name}**`);
    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to create role. Check my permissions.");
    }
  }
};
