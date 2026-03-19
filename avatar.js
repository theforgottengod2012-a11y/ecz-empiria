const { EmbedBuilder } = require("discord.js");
const { resolveUser } = require("../../utils/resolver");

module.exports = {
  name: "avatar",
  aliases: ["av", "pfp"],
  description: "Show a user's avatar",
  module: "extra",
  async execute(message, args) {
    const user = (await resolveUser(message, args[0])) || message.author;
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Avatar`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setColor(0x00AE86);

    message.reply({ embeds: [embed] });
  }
};