const Clan = require("../../database/models/Clan");

const costs = {
  bank: 100000,
  work: 120000,
  rob: 150000,
  members: 200000
};

module.exports = {
  name: "clan-upgrade",
  aliases: ["clan upgrade"],
  async execute(message, args, client) {
    const type = args[0];
    const clan = await Clan.findOne({ members: message.author.id });

    if (!clan) return message.reply("❌ You are not in a clan.");
    if (message.author.id !== clan.ownerId)
      return message.reply("❌ Only owner can upgrade.");

    if (!costs[type]) return message.reply("❌ Invalid upgrade type. Use: bank, work, rob, members");

    if (clan.bank < costs[type])
      return message.reply(`❌ Clan bank insufficient. Need $${costs[type].toLocaleString()}`);

    clan.bank -= costs[type];

    if (type === "bank") clan.upgrades.bankBoost++;
    if (type === "work") clan.upgrades.workBoost++;
    if (type === "rob") clan.upgrades.robDefense++;
    if (type === "members") clan.upgrades.memberCap += 5;

    await clan.save();
    message.reply(`✅ **${type}** upgrade successful!`);
  }
};