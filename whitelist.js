const Guild = require("../../database/models/GuildSettings");

module.exports = {
  name: "antinuke",
  description: "Manage Anti-Nuke settings",
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) 
      return message.reply("You need Administrator permissions to use this command.");

    let guildData = await Guild.findOne({ guildId: message.guild.id });
    if (!guildData) {
        guildData = await Guild.create({ guildId: message.guild.id });
    }
    
    const action = args[0]?.toLowerCase();
    const userId = args[1]?.replace(/\D/g, "");

    if (!action) return message.reply("Usage: `$antinuke whitelist add/remove <@user/ID>` or `$antinuke toggle` or `$antinuke logs <#channel>`");

    if (action === "whitelist") {
      const subAction = args[1]?.toLowerCase();
      const targetId = args[2]?.replace(/\D/g, "");
      if (!subAction || !targetId) return message.reply("Usage: `$antinuke whitelist add/remove <@user/ID>`");

      if (subAction === "add") {
        if (!guildData.whitelist.includes(targetId)) {
            guildData.whitelist.push(targetId);
            await guildData.save();
        }
        message.reply(`✅ Added <@${targetId}> to the Anti-Nuke whitelist.`);
      } else if (subAction === "remove") {
        guildData.whitelist = guildData.whitelist.filter(id => id !== targetId);
        await guildData.save();
        message.reply(`❌ Removed <@${targetId}> from the Anti-Nuke whitelist.`);
      }
    } else if (action === "toggle") {
        guildData.antiNuke = !guildData.antiNuke;
        await guildData.save();
        message.reply(`🛡️ Anti-Nuke is now **${guildData.antiNuke ? "Enabled" : "Disabled"}**.`);
    } else if (action === "logs") {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
        if (!channel) return message.reply("Please mention a valid channel.");
        guildData.logsChannel = channel.id;
        await guildData.save();
        message.reply(`📁 Anti-Nuke logs set to ${channel}.`);
    }
  },
};