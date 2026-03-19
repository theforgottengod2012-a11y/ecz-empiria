const User = require("../database/models/User");

async function getLeaderboard(type, limit = 10) {
  let users = await User.find({ isBot: { $not: { $eq: true } } });

  let sorted;

  switch (type) {
    case "money":
      sorted = users.sort((a, b) =>
        (b.wallet + b.bank) - (a.wallet + a.bank)
      );
      break;

    case "networth":
      sorted = users.sort((a, b) =>
        calculateNetworth(b) - calculateNetworth(a)
      );
      break;

    case "level":
      sorted = users.sort((a, b) => b.level - a.level);
      break;

    case "prestige":
      sorted = users.sort((a, b) =>
        (b.prestige?.level || 0) - (a.prestige?.level || 0)
      );
      break;

    case "gamble":
      sorted = users.sort((a, b) =>
        (b.gambling?.totalWon || 0) - (a.gambling?.totalWon || 0)
      );
      break;

    case "pets":
      sorted = users.sort((a, b) =>
        (b.pets?.ownedPets?.length || 0) -
        (a.pets?.ownedPets?.length || 0)
      );
      break;

    default:
      return null;
  }

  return sorted.slice(0, limit);
}

function calculateNetworth(user) {
  let inventoryValue = 0;

  if (user.inventory) {
    for (const item of user.inventory) {
      inventoryValue += (item.quantity || 1) * 100; // base value
    }
  }

  let petValue = (user.pets?.ownedPets?.length || 0) * 5000;

  return (
    user.wallet +
    user.bank +
    inventoryValue +
    petValue
  );
}

module.exports = {
  getLeaderboard,
};