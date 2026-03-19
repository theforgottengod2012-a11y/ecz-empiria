const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Government = require("../../database/models/Government");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  name: "regulations",
  description: "Manage government regulations",
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
      return message.reply("❌ Government system is not enabled.");
    }

    switch (subcommand) {
      case "add": {
        const name = args[1];
        const category = args[2];
        const rules = args.slice(3).join(" ");

        if (!name || !category || !rules) {
          return message.reply("Usage: `$regulations add <name> <category> <rules>`");
        }

        const regulationId = uuidv4();
        government.regulations.push({
          regulationId,
          name,
          category,
          rules,
          enabled: true
        });
        await government.save();

        return message.reply({
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
          return message.reply("❌ No regulations have been created yet.");
        }

        const regsList = government.regulations
          .map(
            (reg, i) =>
              `**${i + 1}. ${reg.name}** (${reg.category}) ${reg.enabled ? "✅" : "❌"}\n` +
              `Rules: ${reg.rules}`
          )
          .join("\n\n");

        return message.reply({
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
        const regIndex = parseInt(args[1]) - 1;
        if (isNaN(regIndex) || regIndex < 0 || regIndex >= government.regulations.length) {
          return message.reply("❌ Invalid regulation number.");
        }

        const removedReg = government.regulations[regIndex];
        government.regulations.splice(regIndex, 1);
        await government.save();

        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ff0000")
              .setTitle("✅ Regulation Removed")
              .setDescription(`**${removedReg.name}** has been removed.`)
          ]
        });
      }

      case "toggle": {
        const regIndex = parseInt(args[1]) - 1;
        if (isNaN(regIndex) || regIndex < 0 || regIndex >= government.regulations.length) {
          return message.reply("❌ Invalid regulation number.");
        }

        government.regulations[regIndex].enabled = !government.regulations[regIndex].enabled;
        await government.save();

        return message.reply({
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

      default:
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("📋 Regulations Commands")
              .addFields(
                { name: "$regulations add <name> <category> <rules>", value: "Add a regulation" },
                { name: "$regulations list", value: "List all regulations" },
                { name: "$regulations remove <number>", value: "Remove a regulation" },
                { name: "$regulations toggle <number>", value: "Enable/disable a regulation" }
              )
          ]
        });
    }
  }
};
