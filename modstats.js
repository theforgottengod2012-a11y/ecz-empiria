const { EmbedBuilder } = require("discord.js");
const ModTracker  = require("../../database/models/ModTracker");
const { buildMemberStatsEmbed } = require("../../utils/modTracker");

module.exports = {
  name: "modstats",
  description: "View a staff member's activity stats",
  usage: "$modstats [@user]",
  aliases: ["mstats", "actstats"],
  module: "moderation",

  async execute(message, args, client) {
    const config = await ModTracker.findOne({ guildId: message.guild.id });
    const staffRoleIds = config?.staffRoleIds || [];

    const isStaff =
      !staffRoleIds.length ||
      message.member.roles.cache.some(r => staffRoleIds.includes(r.id)) ||
      message.member.permissions.has("Administrator") ||
      message.author.id === process.env.BOT_OWNER_ID;

    if (!isStaff) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff4444)
            .setTitle("❌ Staff Only")
            .setDescription("This command is only available to staff members.")
        ]
      });
    }

    const target = message.mentions.members.first() || message.member;
    const embed  = await buildMemberStatsEmbed(message.guild, target, config);
    return message.reply({ embeds: [embed] });
  }
};
