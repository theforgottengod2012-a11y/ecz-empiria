const { EmbedBuilder } = require("discord.js");
const User = require("../../database/models/User");

module.exports = {
  name: "afk",
  description: "Set your AFK status",
  module: "utility",
  async execute(message, args) {
    const reason = args.join(" ") || "Lurking around...";
    
    await User.findOneAndUpdate(
      { userId: message.author.id },
      { 
        afk: { 
          status: true, 
          reason, 
          timestamp: new Date(),
          lastMessage: message.content
        } 
      },
      { upsert: true }
    );

    const embed = new EmbedBuilder()
      .setColor("#2f3136")
      .setDescription(`🌙 **User is AFK**\n\n**${message.author.username}** is currently chilling away from the keyboard.\n\n> **Reason:** ${reason}`);

    message.reply({ embeds: [embed] });
  },
};
