const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "embed",
  description: "Create a simple embed",
  permissions: ["ManageMessages"],

  async execute(message, args) {
    const text = args.join(" ");
    if (!text) return message.reply("❌ Provide content for the embed.");

    const embed = new EmbedBuilder()
      .setDescription(text)
      .setColor("#2f3136");

    message.channel.send({ embeds: [embed] });
  }
};