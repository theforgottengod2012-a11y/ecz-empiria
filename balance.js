const { getUser } = require("../../utils/economy");
const { dataEmbed, COLORS } = require("../../utils/embeds");

module.exports = {
  name: "balance",
  aliases: ["bal", "money"],
  description: "Check your balance",
  module: "economy",
  async execute(message, args, client) {
    const user = await getUser(message.author.id);
    
    const embed = dataEmbed("CORE_FINANCIALS", [
      { name: "Pocket", value: `💵 ${user.wallet.toLocaleString()}`, inline: true },
      { name: "Bank", value: `🏦 ${user.bank.toLocaleString()}`, inline: true },
      { name: "TOTAL_ASSETS", value: `💰 ${(user.wallet + user.bank).toLocaleString()}`, inline: false },
    ], COLORS.SUCCESS);
    
    message.reply({ embeds: [embed] });
  },
};