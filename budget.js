const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Government = require("../../database/models/Government");

module.exports = {
  name: "budget",
  description: "Manage government budget",
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
      case "view": {
        const totalBudget = government.budget.infrastructure +
          government.budget.healthcare +
          government.budget.education +
          government.budget.defense +
          government.budget.welfare;

        return message.reply({
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
        const category = args[1]?.toLowerCase();
        const amount = parseInt(args[2]);

        const validCategories = ["infrastructure", "healthcare", "education", "defense", "welfare"];

        if (!validCategories.includes(category)) {
          return message.reply(
            `❌ Invalid category. Use: ${validCategories.join(", ")}`
          );
        }

        if (isNaN(amount) || amount <= 0) {
          return message.reply("❌ Please enter a valid amount.");
        }

        if (government.taxes.treasury < amount) {
          return message.reply("❌ Not enough funds in treasury.");
        }

        government.taxes.treasury -= amount;
        government.budget[category] += amount;
        government.budget.totalExpenses += amount;
        await government.save();

        return message.reply({
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

      default:
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1f8b4c")
              .setTitle("💰 Budget Commands")
              .addFields(
                { name: "$budget view", value: "View the government budget" },
                { name: "$budget allocate <category> <amount>", value: "Allocate funds to a category" }
              )
          ]
        });
    }
  }
};
