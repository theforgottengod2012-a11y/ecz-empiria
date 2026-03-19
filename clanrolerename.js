const Clan = require("../../database/models/Clan");

module.exports = {
  name: "clanrolerename",
  description: "Rename your clan role",
  module: "clans",
  async execute(message, args) {
    const clan = await Clan.findOne({ ownerId: message.author.id });
    if (!clan || !clan.roleId) return message.reply("❌ You don't own a clan or haven't bought a clan role.");
    
    const name = args.join(" ");
    if (!name) return message.reply("❌ Usage: `$clanrolerename <name>`");
    
    const role = message.guild.roles.cache.get(clan.roleId);
    if (!role) return message.reply("❌ Role not found.");
    
    await role.setName(name);
    message.reply(`✅ Renamed clan role to **${name}**`);
  }
};
