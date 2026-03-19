const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Government = require("../../database/models/Government");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("treasury")
    .setDescription("View the government treasury"),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    let government = await Government.findOne({ guildId });
    if (!government) {
      return interaction.reply({
        content: "❌ No government system found in this server.",
        ephemeral: true
      });
    }

    if (!government.government.enabled) {
      return interaction.reply({
        content: "❌ Government system is not enabled.",
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#1f8b4c")
          .setTitle("🏛️ Government Treasury")
          .addFields(
            { name: "💵 Current Balance", value: `$${government.taxes.treasury.toLocaleString()}`, inline: false },
            { name: "📊 Total Revenue", value: `$${government.budget.totalRevenue.toLocaleString()}`, inline: true },
            { name: "📉 Total Expenses", value: `$${government.budget.totalExpenses.toLocaleString()}`, inline: true },
            {
              name: "📈 Net Income",
              value: `$${(government.budget.totalRevenue - government.budget.totalExpenses).toLocaleString()}`,
              inline: false
            }
          )
      ]
    });
  }
};
