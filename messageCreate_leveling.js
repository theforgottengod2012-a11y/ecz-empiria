const { addMessageXp } = require("../utils/levelingUtils");

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;
    const result = await addMessageXp(message.guild.id, message.author.id);
    if (result.leveledUp) {
      message.reply(`🎉 **${message.author.username}** reached **level ${result.newLevel}**!`);
    }
  }
};
