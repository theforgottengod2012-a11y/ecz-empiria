const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "serverinfo",
  aliases: ["si"],
  description: "Get detailed information about the server",
  module: "moderation",
  async execute(message, args) {
    const { guild } = message;
    const embed = new EmbedBuilder()
      .setTitle(`Server Info: ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "Members", value: `${guild.memberCount}`, inline: true },
        { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
        { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
        { name: "Emojis", value: `${guild.emojis.cache.size}`, inline: true },
        { name: "Created At", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setColor(0x00ae86);

    message.reply({ embeds: [embed] });
  }
};
