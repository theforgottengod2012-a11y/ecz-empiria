const { EmbedBuilder } = require("discord.js");
const { dataEmbed, COLORS } = require("../../utils/embeds");
const { getUser } = require("../../utils/economy");
const ms = require("ms");

module.exports = {
  name: "userinfo",
  aliases: ["ui", "whois"],
  description: "Display detailed intelligence on a target user",
  usage: "$userinfo [@user/ID]",
  module: "utility",
  async execute(message, args, client) {
    let targetUser;
    
    // 1. Identification Phase
    if (message.mentions.users.first()) {
      targetUser = message.mentions.users.first();
    } else if (args[0]) {
      try {
        targetUser = await client.users.fetch(args[0]);
      } catch (e) {
        // Not an ID or invalid ID
      }
    }
    
    // Fallback to author if not found or specified
    if (!targetUser) {
      if (args[0]) {
        const query = args[0].toLowerCase();
        targetUser = message.guild.members.cache.find(m => 
          m.user.username.toLowerCase().includes(query) || 
          m.nickname?.toLowerCase().includes(query)
        )?.user;
      }
      if (!targetUser) targetUser = message.author;
    }

    const member = message.guild.members.cache.get(targetUser.id);
    const ecoUser = await getUser(targetUser.id, targetUser.bot);

    // 2. Data Compilation
    const accountCreated = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`;
    const joinedServer = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "NOT_IN_GUILD";
    
    const fields = [
      { name: "IDENTIFIER", value: `\`${targetUser.tag}\` (${targetUser.id})`, inline: false },
      { name: "NEURAL_AGE", value: accountCreated, inline: true },
      { name: "UPLINK_ESTABLISHED", value: joinedServer, inline: true },
      { name: "STATUS", value: member?.presence?.status?.toUpperCase() || "OFFLINE/UNKNOWN", inline: true },
      { name: "FINANCIAL_STATUS", value: `💵 $${ecoUser.wallet.toLocaleString()} | 🏦 $${ecoUser.bank.toLocaleString()}`, inline: false },
      { name: "SYSTEM_RANK", value: `LEVEL ${ecoUser.level || 1} (${ecoUser.xp || 0} XP)`, inline: true },
      { name: "ROLES", value: member ? member.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.toString()).join(", ") || "NONE" : "N/A", inline: false }
    ];

    const embed = dataEmbed(`USER_DATA_RETRIEVAL: ${targetUser.username.toUpperCase()}`, fields, COLORS.BLUE)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    message.reply({ embeds: [embed] });
  },
};
