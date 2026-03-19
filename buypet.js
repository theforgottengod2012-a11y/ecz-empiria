const User = require("../../database/models/User");
const pets = require("../../data/pets");

module.exports = {
  name: "buypet",
  async execute(message, args, client) {
    const petId = args[0];
    if (!pets[petId]) return message.reply("❌ Invalid pet.");

    const user = await User.findOne({ userId: message.author.id });
    if (!user) return message.reply("❌ User not found in database.");
    if (user.wallet < 2000) return message.reply("💸 Not enough money.");

    user.wallet -= 2000;
    user.pets.ownedPets.push({
      petId,
      level: 1,
      exp: 0,
    });

    await user.save();
    message.channel.send(`🐾 You bought a **${pets[petId].name}**`);
  },
};