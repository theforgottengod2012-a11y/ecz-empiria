const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "roleposition",
  description: "Check the position of a role",
  permissions: ["ManageRoles"],
  module: "moderation",
  async execute(message, args) {
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if (!role) return message.reply("❌ Please provide a valid role or role ID.");

    message.reply(`📍 The role **${role.name}** is at position **${role.position}**.`);
  },
};
