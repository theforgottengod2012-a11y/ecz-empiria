module.exports = {
  name: "uptime",
  description: "Check how long the bot has been running",
  async execute(message, args, client) {
    const duration = require('ms')(client.uptime, { long: true });
    message.reply(`🚀 I've been online for **${duration}**.`);
  }
};