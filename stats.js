const Giveaway = require("../../database/models/Giveaway");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "giveaway-stats",
  async execute(message, args, client) {
    const active = await Giveaway.countDocuments({ ended: false });
    const total = await Giveaway.countDocuments();
    const winners = await Giveaway.aggregate([
      { $match: { ended: true } },
      { $group: { _id: null, totalWinners: { $sum: "$winners" } } }
    ]);

    const embed = new EmbedBuilder()
      .setTitle("📊 Giveaway Statistics")
      .addFields(
        { name: "Active Giveaways", value: active.toString(), inline: true },
        { name: "Total Giveaways", value: total.toString(), inline: true },
        { name: "Total Winners", value: (winners[0]?.totalWinners || 0).toString(), inline: true }
      )
      .setColor(0x00ae86);

    message.reply({ embeds: [embed] });
  }
};
