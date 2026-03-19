const { EmbedBuilder, ChannelType } = require("discord.js");
const { dataEmbed, COLORS } = require("../../utils/embeds");

module.exports = {
  name: "serverinfo",
  aliases: ["si", "server"],
  description: "Display detailed intelligence on the current server",
  usage: "$serverinfo",
  module: "utility",
  async execute(message, args, client) {
    const { guild } = message;
    
    // 1. Data Compilation
    const owner = await guild.fetchOwner();
    const created = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;
    
    const channelCount = guild.channels.cache.size;
    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    
    const roles = guild.roles.cache.size;
    const emojis = guild.emojis.cache.size;
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;

    const fields = [
      { name: "IDENTIFIER", value: `\`${guild.name}\` (${guild.id})`, inline: false },
      { name: "COMMAND_AUTHORITY", value: `${owner.user.tag}`, inline: true },
      { name: "FOUNDATION_DATE", value: created, inline: true },
      { name: "POPULATION", value: `👥 ${guild.memberCount.toLocaleString()} Members`, inline: true },
      { name: "ARCHITECTURE", value: `📁 ${channelCount} Channels (${textChannels} Text | ${voiceChannels} Voice)`, inline: false },
      { name: "RESOURCES", value: `🎭 ${roles} Roles | 😄 ${emojis} Emojis`, inline: true },
      { name: "SYSTEM_UPGRADES", value: `🚀 Level ${boostLevel} (${boostCount} Boosts)`, inline: true }
    ];

    const embed = dataEmbed(`SERVER_DATA_RETRIEVAL: ${guild.name.toUpperCase()}`, fields, COLORS.CYAN)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    message.reply({ embeds: [embed] });
  },
};
