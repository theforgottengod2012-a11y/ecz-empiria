module.exports = {
  name: "lock",
  description: "Lock the current channel",
  permissions: ["ManageChannels"],

  async execute(message, args) {
    if (!message.guild.members.me.permissionsIn(message.channel).has("ManageRoles")) {
      return message.reply("❌ I do not have permission to manage permissions in this channel.");
    }
    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false
      });
      message.channel.send("🔒 Channel locked.");
    } catch (error) {
      console.error(error);
      message.reply("❌ Failed to lock channel.");
    }
  }
};