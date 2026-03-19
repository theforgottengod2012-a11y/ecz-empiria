const Clan = require("../../database/models/Clan");

module.exports = {
  name: "clanrolehex",
  description: "Change your clan role color",
  module: "clans",
  async execute(message, args) {
    const clan = await Clan.findOne({ ownerId: message.author.id });
    if (!clan || !clan.roleId) return message.reply("❌ You don't own a clan or haven't bought a clan role.");
    
    const hex = args[0];
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return message.reply("❌ Usage: `$clanrolehex #FFFFFF` (must be hex code)");
    
    const role = message.guild.roles.cache.get(clan.roleId);
    if (!role) return message.reply("❌ Role not found.");
    
    await role.setColor(hex);
    message.reply(`✅ Changed clan role color to **${hex}**`);
  }
};
