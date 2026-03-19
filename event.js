const globalEvent = require("../../utils/globalEvent");

module.exports = {
  name: "event",
  description: "Manage global events (Admin only)",
  async execute(message, args, client) {
    if (!message.member.permissions.has("Administrator"))
      return message.reply("❌ Admin only.");

    const type = args[0];
    const duration = parseInt(args[1]);

    if (type === "stop") {
      globalEvent.stop();
      return message.reply("⏹️ Global event stopped.");
    }

    if (!type || !duration)
      return message.reply("Usage: `$event <double_money|double_xp> <minutes>` or `$event stop`.");

    globalEvent.start(type, duration);

    message.channel.send(
      `🌍 **GLOBAL EVENT STARTED!**\n` +
      `🔥 Event: **${type.replace("_", " ").toUpperCase()}**\n` +
      `⏱️ Duration: **${duration} minutes**`
    );
  }
};