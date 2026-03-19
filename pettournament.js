const User = require("../../database/models/User");

module.exports = {
  name: "pettournament",
  description: "Battle another user's pet",
  async execute(message, args) {
    if (!args[0]) return message.reply("Mention a user to battle.");

    const challenger = await User.findOne({ userId: message.author.id });
    const opponent = await User.findOne({ userId: args[0].replace(/\D/g, "") });

    if (!challenger?.pets.activePet || !opponent?.pets.activePet)
      return message.reply("Both users must have an active pet.");

    const pet1 = challenger.pets.ownedPets.find(p => p.petId === challenger.pets.activePet);
    const pet2 = opponent.pets.ownedPets.find(p => p.petId === opponent.pets.activePet);

    // simple battle formula
    const power1 = pet1.level * 10 + Math.floor(Math.random() * 50);
    const power2 = pet2.level * 10 + Math.floor(Math.random() * 50);

    let winner, loser;
    if (power1 > power2) {
      winner = pet1; loser = pet2;
      pet1.bond += 2; pet2.bond += 1;
    } else {
      winner = pet2; loser = pet1;
      pet2.bond += 2; pet1.bond += 1;
    }

    await challenger.save();
    await opponent.save();

    message.reply(`🏆 **${winner.name || winner.petId} wins!** Bond increased. 🐾`);
  },
};