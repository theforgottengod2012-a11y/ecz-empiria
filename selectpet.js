const User = require("../../database/models/User");

module.exports = {
  name: "selectpet",
  description: "Select a pet to be active",
  async execute(message, args) {
    if (!args[0]) return message.reply("Please specify the pet name or ID to select.");
    const user = await User.findOne({ userId: message.author.id });
    if (!user) return message.reply("You don’t own any pets.");

    const pet = user.pets.ownedPets.find(p => p.name?.toLowerCase() === args[0].toLowerCase() || p.petId.toLowerCase() === args[0].toLowerCase());
    if (!pet) return message.reply("Pet not found.");

    user.pets.activePet = pet.petId;
    await user.save();
    message.reply(`✅ ${pet.name || pet.petId} is now your active pet!`);
  },
};