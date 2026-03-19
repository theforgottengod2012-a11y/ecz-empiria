const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Government = require("../../database/models/Government");

module.exports = {
  name: "govsetup",
  description: "Setup and configure the government system for your server",
  category: "government",
  ownerOnly: false,
  userPermissions: [PermissionFlagsBits.Administrator],
  async execute(message, args) {
    const guildId = message.guild.id;
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#1f8b4c")
            .setTitle("🏛️ Government System Setup")
            .setDescription("Use the following subcommands to setup your government system:")
            .addFields(
              { name: "$govsetup enable", value: "Enable the government system" },
              { name: "$govsetup type <democracy/monarchy/autocracy/republic>", value: "Set government type" },
              { name: "$govsetup president <@user>", value: "Set president" },
              { name: "$govsetup vicepres <@user>", value: "Set vice president" },
              { name: "$govsetup incometax <0-100>", value: "Set income tax percentage" },
              { name: "$govsetup capitalgains <0-100>", value: "Set capital gains tax" },
              { name: "$govsetup wealthtax <0-100>", value: "Set wealth tax" },
              { name: "$govsetup businesstax <0-100>", value: "Set business tax" },
              { name: "$govsetup gamblingtax <0-100>", value: "Set gambling tax" },
              { name: "$govsetup status", value: "View current government settings" }
            )
            .setFooter({ text: "Server Admins Only" })
        ]
      });
    }

    let government = await Government.findOne({ guildId });
    if (!government) {
      government = new Government({ guildId });
    }

    switch (subcommand) {
      case "enable": {
        government.government.enabled = true;
        await government.save();
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#00ff00")
              .setTitle("✅ Government System Enabled")
              .setDescription("The government system is now active in this server!")
          ]
        });
      }

      case "type": {
        const type = args[1]?.toLowerCase();
        const validTypes = ["democracy", "monarchy", "autocracy", "republic"];
        if (!validTypes.includes(type)) {
          return message.reply(
            `❌ Invalid government type. Use: ${validTypes.join(", ")}`
          );
        }
        government.government.governmentType = type;
        await government.save();
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Government Type Set")
              .setDescription(`Government type changed to: **${type}**`)
          ]
        });
      }

      case "president": {
        const user = message.mentions.users.first();
        if (!user) return message.reply("❌ Please mention a user!");
        government.government.presidentId = user.id;
        await government.save();
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ President Set")
              .setDescription(`**${user.tag}** is now the President!`)
          ]
        });
      }

      case "vicepres": {
        const user = message.mentions.users.first();
        if (!user) return message.reply("❌ Please mention a user!");
        government.government.vicePresidentId = user.id;
        await government.save();
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Vice President Set")
              .setDescription(`**${user.tag}** is now the Vice President!`)
          ]
        });
      }

      case "incometax": {
        const percent = parseInt(args[1]);
        if (isNaN(percent) || percent < 0 || percent > 100) {
          return message.reply("❌ Please enter a value between 0-100");
        }
        government.taxes.incomeTax = percent;
        await government.save();
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Income Tax Set")
              .setDescription(`Income tax is now: **${percent}%**`)
          ]
        });
      }

      case "capitalgains": {
        const percent = parseInt(args[1]);
        if (isNaN(percent) || percent < 0 || percent > 100) {
          return message.reply("❌ Please enter a value between 0-100");
        }
        government.taxes.capitalGainsTax = percent;
        await government.save();
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Capital Gains Tax Set")
              .setDescription(`Capital gains tax is now: **${percent}%**`)
          ]
        });
      }

      case "wealthtax": {
        const percent = parseInt(args[1]);
        if (isNaN(percent) || percent < 0 || percent > 100) {
          return message.reply("❌ Please enter a value between 0-100");
        }
        government.taxes.wealthTax = percent;
        await government.save();
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Wealth Tax Set")
              .setDescription(`Wealth tax is now: **${percent}%**`)
          ]
        });
      }

      case "businesstax": {
        const percent = parseInt(args[1]);
        if (isNaN(percent) || percent < 0 || percent > 100) {
          return message.reply("❌ Please enter a value between 0-100");
        }
        government.taxes.businessTax = percent;
        await government.save();
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Business Tax Set")
              .setDescription(`Business tax is now: **${percent}%**`)
          ]
        });
      }

      case "gamblingtax": {
        const percent = parseInt(args[1]);
        if (isNaN(percent) || percent < 0 || percent > 100) {
          return message.reply("❌ Please enter a value between 0-100");
        }
        government.taxes.gambling = percent;
        await government.save();
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("✅ Gambling Tax Set")
              .setDescription(`Gambling tax is now: **${percent}%**`)
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

        return message.reply({
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

      default:
        return message.reply("❌ Unknown subcommand. Use `$govsetup` for help.");
    }
  }
};
