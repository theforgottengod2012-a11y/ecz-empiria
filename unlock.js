module.exports = {
  name: "unlock",
  description: "Unlock the current channel",
  permissions: ["ManageChannels"],

  async execute(message, args) {
    if (!message.guild.members.me.permissionsIn(message.channel).has("ManageRoles")) {
      return message.reply("❌ I do not have permission to manage permissions in this channel.");
    }
    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null
      });
      message.channel.send("🔓 Channel unlocked.");
    } catch (error) {
      console.error(error);
      message.reply("❌ Failed to unlock channel.");
    }
  }
};