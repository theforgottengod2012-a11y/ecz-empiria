const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Government = require("../../database/models/Government");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("budget")
    .setDescription("Manage government budget")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("View the government budget")
    )
    .addSubcommand((sub) =>
      sub
        .setName("allocate")
        .setDescription("Allocate funds to a category")
        .addStringOption((opt) =>
          opt
            .setName("category")
            .setDescription("Budget category")
            .addChoices(
              { name: "Infrastructure", value: "infrastructure" },
              { name: "Healthcare", value: "healthcare" },
              { name: "Education", value: "education" },
              { name: "Defense", value: "defense" },
              { name: "Welfare", value: "welfare" }
            )
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName("amount").setDescription("Amount to allocate").setRequired(true).setMinValue(1)
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    let government = await Government.findOne({ guildId });
    if (!government) {
      government = new Government({ guildId });
    }

    if (!government.government.enabled) {
      return interaction.reply({
        content: "❌ Government system is not enabled.",
        ephemeral: true
      });
    }

    switch (subcommand) {
      case "view": {
        const totalBudget = government.budget.infrastructure +
          government.budget.healthcare +
          government.budget.education +
          government.budget.defense +
          government.budget.welfare;

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("💰 Government Budget")
              .addFields(
                { name: "💵 Treasury", value: `$${government.taxes.treasury.toLocaleString()}`, inline: false },
                { name: "📊 Total Revenue", value: `$${government.budget.totalRevenue.toLocaleString()}`, inline: true },
                { name: "📉 Total Expenses", value: `$${government.budget.totalExpenses.toLocaleString()}`, inline: true },
                {
                  name: "📋 Budget Breakdown",
                  value: `
**Infrastructure:** $${government.budget.infrastructure.toLocaleString()}
**Healthcare:** $${government.budget.healthcare.toLocaleString()}
**Education:** $${government.budget.education.toLocaleString()}
**Defense:** $${government.budget.defense.toLocaleString()}
**Welfare:** $${government.budget.welfare.toLocaleString()}
                  `,
                  inline: false
                },
                { name: "📐 Total Allocated", value: `$${totalBudget.toLocaleString()}`, inline: false }
              )
          ]
        });
      }

      case "allocate": {
        const category = interaction.options.getString("category");
        const amount = interaction.options.getInteger("amount");

        if (government.taxes.treasury < amount) {
          return interaction.reply({
            content: "❌ Not enough funds in treasury.",
            ephemeral: true
          });
        }

        government.taxes.treasury -= amount;
        government.budget[category] += amount;
        government.budget.totalExpenses += amount;
        await government.save();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#00ff00")
              .setTitle("✅ Budget Allocated")
              .addFields(
                { name: "Category", value: category.charAt(0).toUpperCase() + category.slice(1), inline: true },
                { name: "Amount", value: `$${amount.toLocaleString()}`, inline: true },
                { name: "New Treasury", value: `$${government.taxes.treasury.toLocaleString()}`, inline: true }
              )
          ]
        });
      }
    }
  }
};
