module.exports = {
  name: "update",
  description: "Pull latest updates (Developer only)",
  async execute(message, args, client) {
    if (message.author.id !== "YOUR_DEVELOPER_ID") return message.reply("❌ Developer only.");
    message.reply("🔄 Checking for updates...");
  }
};