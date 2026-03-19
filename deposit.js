const { getUser } = require("../../utils/economy");

module.exports = {
  name: "deposit",
  aliases: ["dep"],
  description: "Deposit money into bank",
  module: "economy",

  async execute(message, args, client) {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0)
      return message.reply("❌ Enter a valid amount.");

    const user = await getUser(message.author.id);

    if (user.wallet < amount)
      return message.reply("❌ Not enough money in wallet.");

    user.wallet -= amount;
    user.bank += amount;
    await user.save();

    message.reply(`🏦 Deposited **${amount}** into bank.`);
  },
};
