const Clan = require("../../database/models/Clan");
const User = require("../../database/models/User");

module.exports = {
  name: "clan-withdraw",
  aliases: ["clan withdraw"],
  async execute(message, args, client) {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) return message.reply("❌ Invalid amount.");

    const clan = await Clan.findOne({ members: message.author.id });
    if (!clan) return message.reply("❌ You are not in a clan.");

    if (
      message.author.id !== clan.ownerId &&
      !clan.admins.includes(message.author.id)
    ) {
      return message.reply("❌ Permission denied.");
    }

    if (clan.bank < amount) {
      return message.reply("❌ Clan bank insufficient.");
    }

    const user = await User.findOne({ userId: message.author.id });
    if (!user) return;

    clan.bank -= amount;
    user.wallet += amount;

    await clan.save();
    await user.save();

    message.reply(
      `💸 Withdrawn **$${amount.toLocaleString()}** from clan bank`
    );
  }
};