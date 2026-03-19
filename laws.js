const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Government = require("../../database/models/Government");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  name: "laws",
  description: "Manage laws in the government system",
  category: "government",
  ownerOnly: false,
  userPermissions: [PermissionFlagsBits.Administrator],
  async execute(message, args) {
    const guildId = message.guild.id;
    const subcommand = args[0]?.toLowerCase();

    let government = await Government.findOne({ guildId });
    if (!government) {
      government = new Government({ guildId });
    }

    if (!government.government.enabled) {
      return message.reply("❌ Government system is not enabled. Use `$govsetup enable` first.");
    }

    switch (subcommand) {
      case "add": {
        const name = args[1];
        const description = args.slice(2).join(" ");
        const penalty = parseInt(args[args.length - 1]) || 0;

        if (!name || !description) {
          return message.reply("Usage: `$laws add <name> <description> [penalty]`");
        }

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

        return message.reply({
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
          return message.reply("❌ No laws have been created yet.");
        }

        const lawsList = government.laws
          .map(
            (law, i) =>
              `**${i + 1}. ${law.name}** ${law.enabled ? "✅" : "❌"}\n` +
              `Description: ${law.description}\n` +
              `Penalty: $${law.penalty}`
          )
          .join("\n\n");

        return message.reply({
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
        const lawIndex = parseInt(args[1]) - 1;
        if (isNaN(lawIndex) || lawIndex < 0 || lawIndex >= government.laws.length) {
          return message.reply("❌ Invalid law number.");
        }

        const removedLaw = government.laws[lawIndex];
        government.laws.splice(lawIndex, 1);
        await government.save();

        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ff0000")
              .setTitle("✅ Law Removed")
              .setDescription(`**${removedLaw.name}** has been removed from the laws.`)
          ]
        });
      }

      case "toggle": {
        const lawIndex = parseInt(args[1]) - 1;
        if (isNaN(lawIndex) || lawIndex < 0 || lawIndex >= government.laws.length) {
          return message.reply("❌ Invalid law number.");
        }

        government.laws[lawIndex].enabled = !government.laws[lawIndex].enabled;
        await government.save();

        return message.reply({
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

      default:
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("⚖️ Laws Commands")
              .addFields(
                { name: "$laws add <name> <description> [penalty]", value: "Add a new law" },
                { name: "$laws list", value: "List all laws" },
                { name: "$laws remove <number>", value: "Remove a law" },
                { name: "$laws toggle <number>", value: "Enable/disable a law" }
              )
          ]
        });
    }
  }
};
