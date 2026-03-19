const { EmbedBuilder } = require("discord.js");
const ModLog = require("../../database/models/ModLog");
const { getModLogs } = require("../../utils/modLogging");

module.exports = {
  name: "logs",
  description: "View moderation logs",
  permissions: ["ModerateMembers"],
  async execute(message, args) {
    const filter = {};
    const user = message.mentions.users.first();
    if (user) filter.target = user.id;

    const action = args[0]?.toLowerCase();
    if (action && ["warn", "kick", "ban", "timeout", "crime", "heal"].includes(action)) {
      filter.action = action;
    }

    const logs = await getModLogs(message.guild.id, filter, 10);

    if (logs.length === 0) {
      return message.reply("📂 No logs found.");
    }

    const embed = new EmbedBuilder()
      .setTitle("📋 Moderation Logs")
      .setColor("#2f3136")
      .setTimestamp();

    logs.forEach(log => {
      const target = log.target ? `<@${log.target}>` : "N/A";
      const time = `<t:${Math.floor(log.timestamp.getTime() / 1000)}:R>`;
      embed.addFields({
        name: `${log.action.toUpperCase()} | ${time}`,
        value: `**By:** <@${log.userId}>\n**Target:** ${target}\n**Reason:** ${log.reason}`,
        inline: false
      });
    });

    message.reply({ embeds: [embed] });
  }
};
