const { EmbedBuilder } = require("discord.js");
const Case = require("../../database/models/Case");

module.exports = {
  name: "cases",
  description: "View all cases for a user",
  permissions: ["ModerateMembers"],

  async execute(message, args) {
    const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!user) return message.reply("❌ Mention a user or provide a user ID.");

    const cases = await Case.find({ guildId: message.guild.id, userId: user.id })
      .sort({ createdAt: -1 });

    if (!cases.length) return message.reply(`📂 No cases found for **${user.tag}**.`);

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ Cases for ${user.tag}`)
      .setColor("#2f3136")
      .setTimestamp();

    cases.slice(0, 10).forEach(c => {
      embed.addFields({
        name: `Case #${c.caseId} | ${c.action}`,
        value: `**Moderator:** <@${c.moderatorId}>\n**Reason:** ${c.reason}`,
        inline: false
      });
    });

    if (cases.length > 10) {
      embed.setFooter({ text: `Showing latest 10 of ${cases.length} cases.` });
    }

    message.channel.send({ embeds: [embed] });
  }
};