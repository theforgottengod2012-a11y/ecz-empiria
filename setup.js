const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Government = require("../../database/models/Government");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("govsetup")
    .setDescription("Setup and configure the government system")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("enable")
        .setDescription("Enable the government system")
    )
    .addSubcommand((sub) =>
      sub
        .setName("type")
        .setDescription("Set government type")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Type of government")
            .addChoices(
              { name: "Democracy", value: "democracy" },
              { name: "Monarchy", value: "monarchy" },
              { name: "Autocracy", value: "autocracy" },
              { name: "Republic", value: "republic" }
            )
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("president")
        .setDescription("Set president")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("The new president")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("vicepres")
        .setDescription("Set vice president")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("The new vice president")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("View current government settings")
    )
    .addSubcommand((sub) =>
      sub
        .setName("taxes")
        .setDescription("Set tax rates")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Type of tax")
            .addChoices(
              { name: "Income Tax", value: "incometax" },
              { name: "Capital Gains Tax", value: "capitalgains" },
              { name: "Wealth Tax", value: "wealthtax" },
              { name: "Business Tax", value: "businesstax" },
              { name: "Gambling Tax", value: "gamblingtax" }
            )
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("percentage")
            .setDescription("Tax percentage (0-100)")
            .setMinValue(0)
            .setMaxValue(100)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    let government = await Government.findOne({ guildId });
    if (!government) {
      government = new Government({ guildId });
    }

    switch (subcommand) {
      case "enable": {
        government.government.enabled = true;
        await government.save();
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#00ff00")
              .setTitle("✅ Government System Enabled")
              .setDescription("The government system is now active in this server!")
          ]
        });
      }

      case "type": {
        const type = interaction.options.getString("type");
        government.government.governmentType = type;
        await government.save();
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Government Type Set")
              .setDescription(`Government type changed to: **${type}**`)
          ]
        });
      }

      case "president": {
        const user = interaction.options.getUser("user");
        government.government.presidentId = user.id;
        await government.save();
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ President Set")
              .setDescription(`**${user.tag}** is now the President!`)
          ]
        });
      }

      case "vicepres": {
        const user = interaction.options.getUser("user");
        government.government.vicePresidentId = user.id;
        await government.save();
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Vice President Set")
              .setDescription(`**${user.tag}** is now the Vice President!`)
          ]
        });
      }

      case "status": {
        const president = government.government.presidentId
          ? `<@${government.government.presidentId}>`
          : "Not Set";
        const vicePres = government.government.vicePresidentId
          ? `<@${government.government.vicePresidentId}>`
          : "Not Set";

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("🏛️ Government System Status")
              .addFields(
                {
                  name: "System Status",
                  value: government.government.enabled ? "✅ Enabled" : "❌ Disabled",
                  inline: true
                },
                {
                  name: "Government Type",
                  value: government.government.governmentType,
                  inline: true
                },
                { name: "President", value: president, inline: true },
                { name: "Vice President", value: vicePres, inline: true },
                {
                  name: "💰 Tax Rates",
                  value: `
**Income Tax:** ${government.taxes.incomeTax}%
**Capital Gains Tax:** ${government.taxes.capitalGainsTax}%
**Wealth Tax:** ${government.taxes.wealthTax}%
**Business Tax:** ${government.taxes.businessTax}%
**Gambling Tax:** ${government.taxes.gambling}%
                  `,
                  inline: false
                },
                {
                  name: "💵 Treasury",
                  value: `**Balance:** $${government.taxes.treasury.toLocaleString()}`,
                  inline: false
                }
              )
          ]
        });
      }

      case "taxes": {
        const taxType = interaction.options.getString("type");
        const percentage = interaction.options.getInteger("percentage");

        const taxMap = {
          incometax: "incomeTax",
          capitalgains: "capitalGainsTax",
          wealthtax: "wealthTax",
          businesstax: "businessTax",
          gamblingtax: "gambling"
        };

        government.taxes[taxMap[taxType]] = percentage;
        await government.save();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Tax Rate Updated")
              .setDescription(`${taxType.toUpperCase()} is now **${percentage}%**`)
          ]
        });
      }
    }
  }
};
