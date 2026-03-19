const Warning = require("../../database/models/Warning");

module.exports = {
  name: "warnings",
  description: "View warnings of a user",

  async execute(message, args, client) {
    const user = message.mentions.users.first() || message.author;

    const data = await Warning.findOne({
      guildId: message.guild.id,
      userId: user.id
    });

    if (!data || data.warnings.length === 0) {
      return message.reply("✅ No warnings found.");
    }

    const list = data.warnings
      .map((w, i) => `**${i + 1}.** ${w.reason}`)
      .join("\n");

    message.channel.send(
      `⚠️ **Warnings for ${user.tag}**\n${list}`
    );
  }
};