const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Government = require("../../database/models/Government");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("regulations")
    .setDescription("Manage government regulations")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a regulation")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Regulation name").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("category").setDescription("Regulation category").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("rules").setDescription("Rules and details").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all regulations")
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a regulation")
        .addIntegerOption((opt) =>
          opt.setName("number").setDescription("Regulation number").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("toggle")
        .setDescription("Enable/disable a regulation")
        .addIntegerOption((opt) =>
          opt.setName("number").setDescription("Regulation number").setRequired(true)
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
        const category = interaction.options.getString("category");
        const rules = interaction.options.getString("rules");

        const regulationId = uuidv4();
        government.regulations.push({
          regulationId,
          name,
          category,
          rules,
          enabled: true
        });
        await government.save();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#00ff00")
              .setTitle("✅ Regulation Added")
              .addFields(
                { name: "Name", value: name, inline: true },
                { name: "Category", value: category, inline: true },
                { name: "Rules", value: rules, inline: false }
              )
          ]
        });
      }

      case "list": {
        if (government.regulations.length === 0) {
          return interaction.reply({
            content: "❌ No regulations have been created yet.",
            ephemeral: true
          });
        }

        const regsList = government.regulations
          .map(
            (reg, i) =>
              `**${i + 1}. ${reg.name}** (${reg.category}) ${reg.enabled ? "✅" : "❌"}\n` +
              `Rules: ${reg.rules}`
          )
          .join("\n\n");

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("📋 Government Regulations")
              .setDescription(regsList)
              .setFooter({ text: `Total Regulations: ${government.regulations.length}` })
          ]
        });
      }

      case "remove": {
        const regIndex = interaction.options.getInteger("number") - 1;
        if (regIndex < 0 || regIndex >= government.regulations.length) {
          return interaction.reply({
            content: "❌ Invalid regulation number.",
            ephemeral: true
          });
        }

        const removedReg = government.regulations[regIndex];
        government.regulations.splice(regIndex, 1);
        await government.save();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ff0000")
              .setTitle("✅ Regulation Removed")
              .setDescription(`**${removedReg.name}** has been removed.`)
          ]
        });
      }

      case "toggle": {
        const regIndex = interaction.options.getInteger("number") - 1;
        if (regIndex < 0 || regIndex >= government.regulations.length) {
          return interaction.reply({
            content: "❌ Invalid regulation number.",
            ephemeral: true
          });
        }

        government.regulations[regIndex].enabled = !government.regulations[regIndex].enabled;
        await government.save();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Regulation Status Updated")
              .setDescription(
                `**${government.regulations[regIndex].name}** is now ${government.regulations[regIndex].enabled ? "✅ Enabled" : "❌ Disabled"}`
              )
          ]
        });
      }
    }
  }
};
