const { getUser } = require("../../utils/economy");

module.exports = {
  name: "customicon",
  description: "Change your custom role icon",
  module: "economy",
  async execute(message, args) {
    const user = await getUser(message.author.id);
    if (!user.customRole?.roleId) return message.reply("❌ You don't have a custom role. Buy one with `$buy customrole`.");
    
    // Check if role is expired
    if (user.customRole.expiry && new Date() > new Date(user.customRole.expiry)) {
      return message.reply("❌ Your custom role expired. Renew it with `$buy customrole`.");
    }
    
    const url = args[0] || message.attachments.first()?.url;
    if (!url) return message.reply("❌ Usage: `$customicon <url>` or attach an image file.");
    
    if (!message.guild.features.includes('ROLE_ICONS')) {
      return message.reply("❌ This server doesn't have Server Boosts level 2+. Role icons require higher boost level.");
    }
    
    const role = message.guild.roles.cache.get(user.customRole.roleId);
    if (!role) {
      user.customRole = null;
      await user.save();
      return message.reply("❌ Role no longer exists. Custom role cleared.");
    }

    try {
      await role.setIcon(url);
      message.reply("✅ Changed your role icon!");
    } catch (e) {
      message.reply(`❌ Failed to set icon: ${e.message || "Make sure it's a valid image URL (<256kb) and your server has the ROLE_ICONS feature."}`);
    }
  }
};
