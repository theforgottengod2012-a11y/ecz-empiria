module.exports = {
  name: "restart",
  description: "Restart the bot (Developer only)",
  async execute(message, args, client) {
    if (message.author.id !== "YOUR_DEVELOPER_ID") return message.reply("❌ Developer only.");
    await message.reply("🔄 Restarting bot...");
    process.exit(0);
  }
};