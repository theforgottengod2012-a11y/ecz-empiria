const { EmbedBuilder } = require("discord.js");
const config = require("../config");
const snipeStore = require("../utils/snipeStore");

module.exports = {
  name: "messageDelete",
  async execute(message, client) {
    // Check if message is partial or missing guild/author
    if (message.partial) {
      try {
        await message.fetch();
      } catch (error) {
        return; // Could not fetch partial message
      }
    }

    if (!message.guild || !message.author || message.author.bot) return;

    // Store for snipe
    snipeStore.add(message.channel.id, {
      author: message.author.tag,
      content: message.content || "*No content*",
      time: Date.now()
    });

    const logChannelName = config.modLogChannel || "mod-logs";
    const logChannel = message.guild.channels.cache.find(
      c => c.name === logChannelName
    );
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Message Deleted")
      .addFields(
        { name: "User", value: message.author.tag, inline: true },
        { name: "Channel", value: message.channel.toString(), inline: true },
        { name: "Content", value: message.content || "*Empty*" }
      )
      .setColor("Red")
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  }
};
