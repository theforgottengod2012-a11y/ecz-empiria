const { EmbedBuilder } = require("discord.js");
const User = require("../../database/models/User");

module.exports = {
  name: "mypets",
  description: "View your pets",
  async execute(message, args) {
    let user = await User.findOne({ userId: message.author.id });
    if (!user) return message.reply("You have no pets yet!");

    if (!user.pets.ownedPets.length) return message.reply("You don’t own any pets yet.");

    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Pets`)
      .setColor("Aqua")
      .setDescription(
        user.pets.ownedPets
          .map(p => `**${p.name || p.petId}** - Lv ${p.level} - XP: ${p.xp} - Bond: ${p.bond}`)
          .join("\n")
      );

    message.reply({ embeds: [embed] });
  },
};