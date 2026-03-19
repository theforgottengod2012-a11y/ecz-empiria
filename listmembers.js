const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "listmembers",
  description: "List members with a specific role",
  module: "moderation",
  async execute(message, args) {
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if (!role) return message.reply("❌ Usage: `$listmembers <@role|ID>`");

    const members = role.members.map(m => m.user.tag).join(", ") || "None";
    
    const embed = new EmbedBuilder()
      .setTitle(`Members with role: ${role.name}`)
      .setDescription(members.length > 2000 ? members.substring(0, 1997) + "..." : members)
      .setColor(role.color);

    message.reply({ embeds: [embed] });
  }
};
