const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current music queue"),

  async execute(interaction, client) {
    const serverQueue = client.queue?.get(interaction.guild.id);
    if (!serverQueue || !serverQueue.songs.length) return interaction.reply({ content: "The queue is empty.", ephemeral: true });
    
    const queueList = serverQueue.songs.map((song, index) => `${index + 1}. **${song.title}**`).join("\n");
    await interaction.reply(`📋 **Current Queue:**\n${queueList}`);
  }
};
