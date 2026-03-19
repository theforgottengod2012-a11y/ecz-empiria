const Case = require("../../database/models/Case");

module.exports = {
  name: "case",
  description: "View a moderation case",

  async execute(message, args, client) {
    const id = Number(args[0]);
    if (!id) return message.reply("❌ Provide case ID.");

    const data = await Case.findOne({
      guildId: message.guild.id,
      caseId: id
    });

    if (!data) return message.reply("❌ Case not found.");

    message.channel.send(
      `📂 **Case #${data.caseId}**
User: <@${data.userId}>
Moderator: <@${data.moderatorId}>
Action: **${data.action}**
Reason: ${data.reason}`
    );
  }
};