const Clan = require("../../database/models/Clan");
const User = require("../../database/models/User");

module.exports = {
  name: "clan-info",
  aliases: ["clan info", "c info"],
  async execute(message, args, client) {
    let clan;
    const clanName = args.join(" ");

    if (clanName) {
      clan = await Clan.findOne({ name: { $regex: new RegExp(`^${clanName}$`, 'i') } });
    } else {
      const user = await User.findOne({ userId: message.author.id });
      if (user && user.clanId) {
        clan = await Clan.findOne({ clanId: user.clanId });
      }
    }

    if (!clan) {
      return message.reply("❌ Clan not found or you are not in a clan.");
    }

    const owner = await client.users.fetch(clan.ownerId).catch(() => ({ username: "Unknown" }));

    const embed = {
      title: `🏰 Clan: ${clan.name}`,
      fields: [
        { name: "👑 Owner", value: owner.username, inline: true },
        { name: "📊 Level", value: `${clan.level || 1}`, inline: true },
        { name: "📈 XP", value: `${(clan.xp || 0).toLocaleString()}`, inline: true },
        { name: "💰 Bank", value: `$${(clan.bank || 0).toLocaleString()}`, inline: true },
        { name: "👥 Members", value: `${clan.members.length}`, inline: true }
      ],
      color: 0x00ae86,
      timestamp: new Date()
    };

    message.reply({ embeds: [embed] });
  }
};