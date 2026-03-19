const Clan = require("../../database/models/Clan");

module.exports = {
  name: "clan-invite",
  aliases: ["clan invite"],
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mention someone to invite.");

    const clan = await Clan.findOne({ members: message.author.id });
    if (!clan) return message.reply("❌ You are not in a clan.");

    if (
      message.author.id !== clan.ownerId &&
      !clan.admins.includes(message.author.id)
    ) {
      return message.reply("❌ You lack permission.");
    }

    target.send(
      `🏰 **Clan Invitation**\nYou were invited to join **${clan.name}**\nUse: \`$clan join ${clan.name}\``
    );

    message.reply(`📨 Invite sent to ${target.username}`);
  }
};