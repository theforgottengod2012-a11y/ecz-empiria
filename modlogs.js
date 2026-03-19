const { EmbedBuilder } = require("discord.js");
const Case = require("../../database/models/Case");

module.exports = {
  name: "modlogs",
  description: "View the last 10 moderation cases",
  permissions: ["ModerateMembers"],

  async execute(message, args) {
    const cases = await Case.find({ guildId: message.guild.id })
      .sort({ createdAt: -1 })
      .limit(10);

    if (!cases.length) return message.reply("📂 No moderation cases found.");

    const embed = new EmbedBuilder()
      .setTitle("🛡️ Recent Moderation Logs")
      .setColor("#2f3136")
      .setTimestamp();

    cases.forEach(c => {
      embed.addFields({
        name: `Case #${c.caseId} | ${c.action}`,
        value: `**User:** <@${c.userId}>\n**Moderator:** <@${c.moderatorId}>\n**Reason:** ${c.reason}`,
        inline: false
      });
    });

    message.channel.send({ embeds: [embed] });
  }
};