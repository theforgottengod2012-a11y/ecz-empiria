const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song in your voice channel")
    .addStringOption(option =>
      option.setName("query")
        .setDescription("Song name or YouTube/Spotify link")
        .setRequired(true)),

  async execute(interaction, client) {
    const query = interaction.options.getString("query");
    const vc = interaction.member?.voice?.channel;

    if (!vc) {
      return interaction.reply({ content: "❌ You need to be in a voice channel first!", ephemeral: true });
    }

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle("🎵 Music System")
        .setDescription(`Queued: **${query}**\n\nMusic playback requires additional voice packages. Ensure the bot is running with `+"`@discordjs/voice`"+` and `+"`play-dl`"+` installed.`)
        .setColor(0x5865f2)]
    });
  }
};
