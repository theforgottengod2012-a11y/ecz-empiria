const User = require("../../database/models/User");

module.exports = {
  name: "mypets",
  async execute(message, args, client) {
    const user = await User.findOne({ userId: message.author.id });
    if (!user || user.pets.ownedPets.length === 0)
      return message.reply("❌ You have no pets.");

    const list = user.pets.ownedPets
      .map(p => `${p.petId} | Lvl ${p.level}`)
      .join("\n");

    message.channel.send(`🐶 **Your Pets**\n${list}`);
  },
};