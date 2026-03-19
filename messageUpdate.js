const { EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
  name: "messageUpdate",
  async execute(oldMsg, newMsg, client) {
    // Handle partials
    if (oldMsg.partial) {
      try {
        await oldMsg.fetch();
      } catch (error) {
        return;
      }
    }
    if (newMsg.partial) {
      try {
        await newMsg.fetch();
      } catch (error) {
        return;
      }
    }

    if (!oldMsg.guild || !oldMsg.author || oldMsg.author.bot) return;
    if (oldMsg.content === newMsg.content) return;

    const logChannelName = config.modLogChannel || "mod-logs";
    const logChannel = oldMsg.guild.channels.cache.find(
      c => c.name === logChannelName
    );
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("✏️ Message Edited")
      .addFields(
        { name: "User", value: oldMsg.author.tag },
        { name: "Before", value: oldMsg.content || "*Empty*" },
        { name: "After", value: newMsg.content || "*Empty*" }
      )
      .setColor("Orange")
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  }
};
