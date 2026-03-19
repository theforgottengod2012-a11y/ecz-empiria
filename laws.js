const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Government = require("../../database/models/Government");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("laws")
    .setDescription("Manage government laws")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a new law")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Law name").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("description").setDescription("Law description").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName("penalty").setDescription("Penalty for violation").setMinValue(0)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all laws")
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a law")
        .addIntegerOption((opt) =>
          opt.setName("number").setDescription("Law number to remove").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("toggle")
        .setDescription("Enable/disable a law")
        .addIntegerOption((opt) =>
          opt.setName("number").setDescription("Law number to toggle").setRequired(true)
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
      case "add": {
        const name = interaction.options.getString("name");
        const description = interaction.options.getString("description");
        const penalty = interaction.options.getInteger("penalty") || 0;

        const lawId = uuidv4();
        government.laws.push({
          lawId,
          name,
          description,
          penalty,
          enabled: true,
          createdAt: new Date()
        });
        await government.save();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#00ff00")
              .setTitle("✅ Law Added")
              .addFields(
                { name: "Law Name", value: name, inline: false },
                { name: "Description", value: description, inline: false },
                { name: "Penalty", value: `$${penalty}`, inline: true }
              )
          ]
        });
      }

      case "list": {
        if (government.laws.length === 0) {
          return interaction.reply({
            content: "❌ No laws have been created yet.",
            ephemeral: true
          });
        }

        const lawsList = government.laws
          .map(
            (law, i) =>
              `**${i + 1}. ${law.name}** ${law.enabled ? "✅" : "❌"}\n` +
              `Description: ${law.description}\n` +
              `Penalty: $${law.penalty}`
          )
          .join("\n\n");

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("⚖️ Server Laws")
              .setDescription(lawsList)
              .setFooter({ text: `Total Laws: ${government.laws.length}` })
          ]
        });
      }

      case "remove": {
        const lawIndex = interaction.options.getInteger("number") - 1;
        if (lawIndex < 0 || lawIndex >= government.laws.length) {
          return interaction.reply({
            content: "❌ Invalid law number.",
            ephemeral: true
          });
        }

        const removedLaw = government.laws[lawIndex];
        government.laws.splice(lawIndex, 1);
        await government.save();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ff0000")
              .setTitle("✅ Law Removed")
              .setDescription(`**${removedLaw.name}** has been removed from the laws.`)
          ]
        });
      }

      case "toggle": {
        const lawIndex = interaction.options.getInteger("number") - 1;
        if (lawIndex < 0 || lawIndex >= government.laws.length) {
          return interaction.reply({
            content: "❌ Invalid law number.",
            ephemeral: true
          });
        }

        government.laws[lawIndex].enabled = !government.laws[lawIndex].enabled;
        await government.save();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Law Status Updated")
              .setDescription(
                `**${government.laws[lawIndex].name}** is now ${government.laws[lawIndex].enabled ? "✅ Enabled" : "❌ Disabled"}`
              )
          ]
        });
      }
    }
  }
};
