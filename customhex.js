const { getUser } = require("../../utils/economy");

module.exports = {
  name: "customhex",
  description: "Change your custom role color",
  module: "economy",
  async execute(message, args) {
    const user = await getUser(message.author.id);
    if (!user.customRole?.roleId) return message.reply("❌ You don't have a custom role. Buy one with `$buy customrole`.");
    
    // Check if role is expired
    if (user.customRole.expiry && new Date() > new Date(user.customRole.expiry)) {
      return message.reply("❌ Your custom role expired. Renew it with `$buy customrole`.");
    }
    
    const hex = args[0];
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return message.reply("❌ Usage: `$customhex #FFFFFF` (must be valid hex code)");
    
    const role = message.guild.roles.cache.get(user.customRole.roleId);
    if (!role) {
      user.customRole = null;
      await user.save();
      return message.reply("❌ Role no longer exists. Custom role cleared.");
    }
    
    try {
      await role.setColor(hex);
      message.reply(`✅ Changed your role color to **${hex}**`);
    } catch (error) {
      message.reply(`❌ Failed to change color: ${error.message}`);
    }
  }
};
