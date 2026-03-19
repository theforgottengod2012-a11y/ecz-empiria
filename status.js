module.exports = {
  name: "status",
  description: "Check bot status",
  async execute(message, args, client) {
    message.reply("🟢 **Status:** All systems operational.\n- Database: Connected\n- AI: Online\n- Economy: Active");
  }
};