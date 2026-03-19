const {
  getUser,
  addMoney,
  removeMoney,
  checkCooldown,
} = require("../../utils/economy");
const DICE_COOLDOWN = 10 * 1000;

module.exports = {
  name: "dice",
  aliases: ["d"],
  description: "Pick 2 numbers from 1-6, bot rolls 2 numbers. Match = win!",
  module: "economy",

  async execute(message, args, client) {
    const userId = message.author.id;

    // Parse arguments: <bet> <num1> <num2>
    const bet = parseInt(args[0]);
    const MAX_BET = 250000;
    const num1 = parseInt(args[1]);
    const num2 = parseInt(args[2]);

    if (isNaN(bet) || bet <= 0 || bet > MAX_BET) return message.reply(`❌ Enter a valid bet amount (Max: 💵 ${MAX_BET}). Usage: \`$dice <bet> <num1> <num2>\``);
    if (isNaN(num1) || isNaN(num2) || num1 < 1 || num1 > 6 || num2 < 1 || num2 > 6)
      return message.reply("❌ You must pick **2 numbers between 1 and 6**. Usage: `$dice <bet> <num1> <num2>`");
    if (num1 === num2) return message.reply("❌ You cannot pick the **same number twice**! Pick 2 different numbers.");

    const user = await getUser(userId);
    if (user.wallet < bet)
      return message.reply("❌ Not enough money in wallet");

    const timeLeft = await checkCooldown(userId, "dice", DICE_COOLDOWN);
    if (timeLeft > 0)
      return message.reply("⏳ Wait a few seconds before rolling again");

    // Bot rolls 2 numbers
    const botRoll = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];

    // Count matches
    let matchCount = 0;
    if (botRoll.includes(num1)) matchCount++;
    if (botRoll.includes(num2)) matchCount++;

    let winnings = 0;
    let resultMessage = "";

    if (matchCount === 2) {
      winnings = bet * 2;
      await addMoney(userId, winnings);
      resultMessage = `🎉 Both numbers matched! You win double: 💵 ${winnings}`;
    } else if (matchCount === 1) {
      winnings = bet;
      await addMoney(userId, winnings);
      resultMessage = `✨ One number matched! You win: 💵 ${winnings}`;
    } else {
      await removeMoney(userId, bet);
      resultMessage = `💀 No match. You lost: 💵 ${bet}`;
    }

    message.reply({
      embeds: [
        {
          title: "🎲 Dice Roll",
          color: winnings > 0 ? 0x57f287 : 0xed4245,
          fields: [
            { name: "Your numbers", value: `${num1} & ${num2}`, inline: true },
            {
              name: "Bot rolled",
              value: `${botRoll[0]} & ${botRoll[1]}`,
              inline: true,
            },
            { name: "Result", value: resultMessage, inline: false },
          ],
        },
      ],
    });
  },
};
