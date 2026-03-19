const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current song"),

  async execute(interaction, client) {
    const serverQueue = client.queue?.get(interaction.guild.id);
    if (!serverQueue) return interaction.reply({ content: "There is no song to skip.", ephemeral: true });
    
    serverQueue.player.stop();
    await interaction.reply("⏭️ Skipped the song.");
  }
};
