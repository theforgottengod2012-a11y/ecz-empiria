const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "rolereposition",
  description: "Change the position of a role",
  permissions: ["ManageRoles"],
  module: "moderation",
  async execute(message, args) {
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    const pos = parseInt(args[1]);

    if (!role) return message.reply("❌ Please provide a valid role or role ID.");
    if (isNaN(pos)) return message.reply("❌ Please provide a valid numeric position.");

    try {
      await role.setPosition(pos);
      message.reply(`✅ Successfully moved **${role.name}** to position **${pos}**.`);
    } catch (e) {
      console.error(e);
      message.reply("❌ Failed to change role position. Check if my role is high enough!");
    }
  },
};
