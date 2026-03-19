const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "roleinfo",
  description: "Get detailed information about a role",
  module: "moderation",
  async execute(message, args) {
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.member.roles.highest;
    if (!role) return message.reply("❌ Role not found.");

    const embed = new EmbedBuilder()
      .setTitle(`Role Info: ${role.name}`)
      .setColor(role.color)
      .addFields(
        { name: "ID", value: `\`${role.id}\``, inline: true },
        { name: "Color", value: `\`${role.hexColor}\``, inline: true },
        { name: "Mention", value: `${role}`, inline: true },
        { name: "Position", value: `${role.position}`, inline: true },
        { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
        { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
        { name: "Created At", value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Members", value: `${role.members.size}`, inline: true }
      );

    message.reply({ embeds: [embed] });
  }
};
