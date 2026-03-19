const { EmbedBuilder } = require("discord.js");
const User = require("../../database/models/User");
const Leveling = require("../../database/models/Leveling");

module.exports = {
  name: "leaderboard",
  aliases: ["lb", "top"],
  description: "Show the top 10 richest or highest level users",
  module: "economy",
  async execute(message, args) {
    const type = args[0]?.toLowerCase();
    
    let title, data, description;
    
    if (type === "xp" || type === "level") {
      const levels = await Leveling.find({ guildId: message.guild.id })
        .sort({ level: -1, totalXp: -1 })
        .limit(10);
      title = "🏆 Level Leaderboard";
      description = levels.map((u, i) => `**${i + 1}.** <@${u.userId}> — Level ${u.level} (${u.totalXp} XP)`).join("\n");
    } else {
      const users = await User.find({ isBot: false })
        .sort({ wallet: -1 })
        .limit(10);
      title = "🏆 Richest Leaderboard";
      description = users.map((u, i) => `**${i + 1}.** <@${u.userId}> — 💵 $${u.wallet.toLocaleString()}`).join("\n");
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(0xF1C40F)
      .setDescription(description || "No data yet.")
      .setFooter({ text: `Use: $leaderboard [xp/wallet] • Requested by ${message.author.tag}` });

    message.reply({ embeds: [embed] });
  }
};
