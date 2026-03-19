module.exports = {
  name: "changelog",
  description: "View latest bot updates",
  async execute(message, args, client) {
    message.reply("📝 **Changelog v2.0.4:**\n- Added AI Knowledge Base (70+ questions)\n- Restored 135+ commands\n- Fixed Clan System ID issues\n- Improved Farming & Economy stability");
  }
};