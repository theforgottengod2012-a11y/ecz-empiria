const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const os = require("os");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Display bot statistics"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("📊 Bot Statistics")
      .addFields(
        { name: "Servers", value: `${interaction.client.guilds.cache.size}`, inline: true },
        { name: "Users", value: `${interaction.client.users.cache.size}`, inline: true },
        { name: "Memory Usage", value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
        { name: "Platform", value: `${os.platform()}`, inline: true },
        { name: "Node.js Version", value: `${process.version}`, inline: true }
      )
      .setColor("Blue")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
