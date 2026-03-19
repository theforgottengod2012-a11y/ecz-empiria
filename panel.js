const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ticketpanel",
  permissions: ["Administrator"],

  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Support Tickets")
      .setDescription("Click a button to open a ticket")
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_support")
        .setLabel("Support")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("ticket_report")
        .setLabel("Report")
        .setStyle(ButtonStyle.Danger)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
};
