const User = require("../../database/models/User");

module.exports = {
  name: "pettrain",
  description: "Train your active pet for XP",
  async execute(message, args) {
    const user = await User.findOne({ userId: message.author.id });
    if (!user || !user.pets.activePet) return message.reply("Select an active pet first!");

    const pet = user.pets.ownedPets.find(p => p.petId === user.pets.activePet);
    if (!pet) return message.reply("Active pet not found.");

    // XP gain
    const xpGain = Math.floor(Math.random() * 50) + 50;
    pet.xp += xpGain;

    // Level up logic
    const nextLevelXP = pet.level * 100;
    if (pet.xp >= nextLevelXP) {
      pet.level++;
      pet.xp -= nextLevelXP;
      pet.bond += 1; // bonding increases on level up
    }

    await user.save();
    message.reply(`🐾 ${pet.name || pet.petId} gained ${xpGain} XP! Now Lv ${pet.level}, Bond ${pet.bond}`);
  },
};