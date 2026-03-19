const Clan = require("../../database/models/Clan");

module.exports = {
  name: "clan-leaderboard",
  aliases: ["clan leaderboard", "clan lb"],
  async execute(message, args, client) {
    const clans = await Clan.find().sort({ level: -1, bank: -1 }).limit(10);

    const embed = {
      title: "🏆 Clan Leaderboard",
      description: clans.length > 0 
        ? clans.map((c, i) => `**${i + 1}. ${c.name}**\nLvl: ${c.level || 1} | 💰 $${(c.bank || 0).toLocaleString()}`).join("\n\n")
        : "No clans found.",
      color: 0xffd700,
      timestamp: new Date()
    };

    message.reply({ embeds: [embed] });
  }
};