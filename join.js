const Clan = require("../../database/models/Clan");
const User = require("../../database/models/User");

module.exports = {
  name: "clan-join",
  aliases: ["clan join"],
  async execute(message, args, client) {
    const name = args.join(" ");
    if (!name) return message.reply("❌ Provide clan name.");

    const user = await User.findOne({ userId: message.author.id });
    if (!user) return;
    if (user.clanId) return message.reply("❌ You are already in a clan.");

    const clan = await Clan.findOne({ name });
    if (!clan) return message.reply("❌ Clan not found.");

    clan.members.push(message.author.id);
    await clan.save();

    user.clanId = clan._id;
    await user.save();

    message.reply(`✅ Joined **${clan.name}**`);
  }
};