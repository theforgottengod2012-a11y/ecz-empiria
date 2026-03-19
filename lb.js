const { EmbedBuilder } = require("discord.js");
const { getLeaderboard } = require("../../utils/leaderboard");

module.exports = {
  name: "lb",
  aliases: ["leaderboard", "top"],
  description: "View global leaderboards",
  usage: "$lb <money|networth|level|prestige|gamble|pets>",
  async execute(message, args, client) { // Added client as first parameter to match command handler pattern if present, or just use message
    const type = args[0]?.toLowerCase() || "money";

    const data = await getLeaderboard(type, 10);
    if (!data) {
      return message.reply("❌ Invalid leaderboard type.");
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${type.toUpperCase()} Leaderboard`)
      .setColor(0x00ffd5)
      .setFooter({ text: "Empiria Global Rankings" });

    data.forEach((user, index) => {
      let value;

      switch (type) {
        case "money":
          value = `💰 ${(user.wallet + user.bank).toLocaleString()}`;
          break;
        case "networth":
          value = `💎 ${(user.wallet + user.bank).toLocaleString()}`; // Added toLocaleString for consistency
          break;
        case "level":
          value = `⭐ Level ${user.level}`;
          break;
        case "prestige":
          value = `👑 Prestige ${user.prestige?.level || 0}`;
          break;
        case "gamble":
          value = `🎰 Won ${(user.gambling?.totalWon || 0).toLocaleString()}`;
          break;
        case "pets":
          value = `🐾 Pets ${user.pets?.ownedPets?.length || 0}`;
          break;
      }

      embed.addFields({
        name: `#${index + 1}`,
        value: `<@${user.userId}> — ${value}`,
        inline: false,
      });
    });

    message.channel.send({ embeds: [embed] });
  },
};