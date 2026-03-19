const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder } = require("discord.js");
const Ticket = require("../../database/models/Ticket");

module.exports = {
  name: "ticket",
  description: "Setup the ticket system",
  permissions: ["Administrator"],
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === "setup") {
      const embed = new EmbedBuilder()
        .setTitle("🎫 Support System")
        .setDescription("Select a category below to open a ticket.")
        .setColor("#2f3136");

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("ticket_select")
          .setPlaceholder("Choose a ticket category...")
          .addOptions([
            { label: "Support", value: "support", emoji: "🛠️" },
            { label: "Report", value: "report", emoji: "🚩" },
            { label: "Appeal", value: "appeal", emoji: "⚖️" },
            { label: "Partnership", value: "partnership", emoji: "🤝" }
          ])
      );

      return message.channel.send({ embeds: [embed], components: [row] });
    }

    message.reply("❌ Usage: `$ticket setup` (more ticket features coming in full polish)");
  }
};
