const { EmbedBuilder } = require("discord.js");
const { getUser, addMoney, removeMoney } = require("../../utils/economy");
const User = require("../../database/models/User");
const Clan = require("../../database/models/Clan");

const OWNER_ID = "1359147702088237076";

module.exports = {
  name: "owner",
  description: "Owner-only management commands",
  module: "core",
  async execute(message, args) {
    if (message.author.id !== OWNER_ID) return;

    const action = args[0]?.toLowerCase();
    
    // Economy Management
    if (action === "eco") {
      const sub = args[1]?.toLowerCase();
      const target = message.mentions.users.first();
      const amount = parseInt(args[3]);

      if (sub === "add") {
        await addMoney(target.id, amount);
        return message.reply(`✅ Added ${amount} to ${target.tag}`);
      }
      if (sub === "reset") {
        await User.findOneAndUpdate({ userId: target.id }, { wallet: 500, bank: 0 });
        return message.reply(`✅ Reset ${target.tag}'s balance`);
      }
    }

    // Clan Management
    if (action === "clan") {
      const sub = args[1]?.toLowerCase();
      const clanName = args.slice(2).join(" ");
      if (sub === "delete") {
        const clan = await Clan.findOneAndDelete({ name: clanName });
        if (!clan) return message.reply("Clan not found.");
        await User.updateMany({ clanId: clan._id }, { clanId: null });
        return message.reply(`✅ Deleted clan ${clanName}`);
      }
    }

    message.reply("Available: `$owner eco <add/reset> <@user> <amount>`, `$owner clan delete <name>`");
  },
};
