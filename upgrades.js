const Clan = require("../../database/models/Clan");

module.exports = {
  name: "clan-upgrades",
  aliases: ["clan upgrades"],
  async execute(message, args, client) {
    const clan = await Clan.findOne({ members: message.author.id });
    if (!clan) return message.reply("❌ You are not in a clan.");

    message.reply(
`🧬 **Clan Upgrades**
🏦 Bank Boost: ${clan.upgrades.bankBoost * 5}%
⚒️ Work Boost: ${clan.upgrades.workBoost * 5}%
🛡️ Rob Defense: ${clan.upgrades.robDefense * 10}%
👥 Member Cap: ${clan.upgrades.memberCap}

Use:
$clan upgrade <type>`
    );
  }
};