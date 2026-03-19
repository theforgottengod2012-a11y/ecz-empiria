const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop the music and clear the queue"),

  async execute(interaction, client) {
    const serverQueue = client.queue?.get(interaction.guild.id);
    if (!serverQueue) return interaction.reply({ content: "There is no music playing.", ephemeral: true });
    
    serverQueue.songs = [];
    serverQueue.player.stop();
    serverQueue.connection.destroy();
    client.queue.delete(interaction.guild.id);
    await interaction.reply("⏹️ Stopped the music and cleared the queue.");
  }
};
