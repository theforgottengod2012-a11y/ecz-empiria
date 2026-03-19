const Clan = require("../../database/models/Clan");
const { addClanXP } = require("../../utils/clanXP");

module.exports = {
  name: "clan-war",
  aliases: ["clan war"],
  async execute(message, args, client) {
    const enemyName = args.join(" ");
    if (!enemyName) return message.reply("❌ Provide a clan name.");

    const attacker = await Clan.findOne({ members: message.author.id });
    const defender = await Clan.findOne({ name: enemyName });

    if (!attacker || !defender)
      return message.reply("❌ Clan not found.");

    if (attacker.name === defender.name)
      return message.reply("❌ You can’t war yourself.");

    if (attacker.level < 3)
      return message.reply("❌ Clan level too low. (Need Lvl 3)");

    if (attacker.bank < 50000)
      return message.reply("❌ Clan bank needs $50,000.");

    if (Date.now() - attacker.lastWar < 86400000)
      return message.reply("⏳ Clan war cooldown active (24h).");

    attacker.bank -= 50000;
    attacker.lastWar = Date.now();

    const atkPower = attacker.level + attacker.members.length;
    const defPower = defender.level + defender.members.length;

    if (atkPower > defPower) {
      const stolen = Math.floor(defender.bank * (0.1 + Math.random() * 0.1));
      defender.bank -= stolen;
      attacker.bank += stolen;

      await addClanXP(attacker, 250);
      await addClanXP(defender, 50);

      message.reply(`⚔️ **WAR WON!**
💰 Stolen: $${stolen.toLocaleString()}`);
    } else if (atkPower < defPower) {
      const loss = Math.floor(attacker.bank * 0.05);
      attacker.bank -= loss;

      await addClanXP(defender, 250);
      await addClanXP(attacker, 50);

      message.reply(`💀 **WAR LOST**
💸 Lost: $${loss.toLocaleString()}`);
    } else {
      await addClanXP(attacker, 100);
      await addClanXP(defender, 100);
      message.reply("⚔️ **WAR DRAW**");
    }

    await attacker.save();
    await defender.save();
  }
};