const { getUser } = require("../../utils/economy");

module.exports = {
  name: "customrename",
  description: "Rename your custom role",
  module: "economy",
  async execute(message, args) {
    const user = await getUser(message.author.id);
    if (!user.customRole?.roleId) return message.reply("❌ You don't have a custom role. Buy one with `$buy customrole`.");
    
    // Check if role is expired
    if (user.customRole.expiry && new Date() > new Date(user.customRole.expiry)) {
      return message.reply("❌ Your custom role expired. Renew it with `$buy customrole`.");
    }
    
    const name = args.join(" ");
    if (!name) return message.reply("❌ Usage: `$customrename <new name>`");
    if (name.length > 32) return message.reply("❌ Role name must be 32 characters or less.");
    
    const role = message.guild.roles.cache.get(user.customRole.roleId);
    if (!role) {
      user.customRole = null;
      await user.save();
      return message.reply("❌ Role no longer exists. Custom role cleared.");
    }
    
    try {
      await role.setName(name);
      message.reply(`✅ Renamed your role to **${name}**`);
    } catch (error) {
      message.reply(`❌ Failed to rename role: ${error.message}`);
    }
  }
};
