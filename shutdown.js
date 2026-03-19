module.exports = {
  name: "shutdown",
  description: "Shutdown the bot (Developer only)",
  async execute(message, args, client) {
    if (message.author.id !== "YOUR_DEVELOPER_ID") return message.reply("❌ Developer only.");
    await message.reply("🛑 Shutting down...");
    process.exit(0);
  }
};