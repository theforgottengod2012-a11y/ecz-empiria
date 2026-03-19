module.exports = {
  name: "nuke",
  description: "Delete and recreate the current channel",
  permissions: ["Administrator"],

  async execute(message, args) {
    const channel = message.channel;
    const position = channel.position;

    if (!message.guild.members.me.permissions.has("ManageChannels")) {
      return message.reply("❌ I do not have permission to manage channels.");
    }

    try {
      const newChannel = await channel.clone();
      await channel.delete();
      await newChannel.setPosition(position);
      await newChannel.send("☢️ **Channel Nuked.**");
    } catch (error) {
      console.error(error);
      message.reply("❌ Failed to nuke channel.");
    }
  }
};