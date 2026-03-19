const User = require("../../database/models/User");

module.exports = {
  name: "petevolve",
  description: "Evolve your active pet",
  async execute(message, args) {
    const user = await User.findOne({ userId: message.author.id });
    if (!user || !user.pets.activePet) return message.reply("Select an active pet first!");

    const pet = user.pets.ownedPets.find(p => p.petId === user.pets.activePet);
    if (pet.evolved) return message.reply("Pet already evolved!");
    if (pet.level < 10 || pet.bond < 5) return message.reply("Pet needs Lv 10 and Bond 5 to evolve.");

    pet.evolved = true;
    pet.level += 1;
    pet.skills.push("Evolved Skill");
    pet.abilities.push("Evolved Ability");

    await user.save();
    message.reply(`✨ ${pet.name || pet.petId} has evolved! New skills unlocked.`);
  },
};