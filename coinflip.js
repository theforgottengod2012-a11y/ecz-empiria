const { getUser, addMoney, removeMoney, checkCooldown } = require("../../utils/economy");
const { collectTax, registerCitizen } = require("../../utils/governmentTax");
const COINFLIP_COOLDOWN = 10 * 1000;

module.exports = {
  name: "coinflip",
  aliases: ["cf"],
  description: "Flip a coin: heads or tails",
  module: "economy",

  async execute(message, args, client) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const bet = parseInt(args[1]);
    const MAX_BET = 250000;
    const choice = args[0]?.toLowerCase();
    if (!bet || bet <= 0 || bet > MAX_BET || !choice || !["heads","tails"].includes(choice))
      return message.reply(`❌ Usage: \`$coinflip <heads|tails> <amount>\` (Max bet: 💵 ${MAX_BET})`);

    const user = await getUser(userId);
    if (user.wallet < bet) return message.reply("❌ Not enough money.");

    const timeLeft = await checkCooldown(userId, "coinflip", COINFLIP_COOLDOWN);
    if (timeLeft > 0) return message.reply("⏳ Wait a few seconds before flipping again.");

    const flip = Math.random() < 0.5 ? "heads" : "tails";
    let winnings = 0;
    let taxAmount = 0;
    if (choice === flip) {
      winnings = bet * 2;
      await registerCitizen(guildId, userId);
      const { taxAmount: tax, netAmount } = await collectTax(guildId, userId, winnings, "gambling");
      taxAmount = tax;
      await addMoney(userId, netAmount);
      winnings = netAmount;
    } else {
      await removeMoney(userId, bet);
    }

    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("cf_play_again").setLabel("Play Again").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("cf_challenge").setLabel("Challenge Someone").setStyle(ButtonStyle.Secondary)
    );

    message.reply({
      embeds: [{
        title: "🪙 Coinflip",
        color: winnings>0 ? 0x57f287 : 0xed4245,
        fields:[
          {name:"Your choice", value: choice, inline:true},
          {name:"Result", value: flip, inline:true},
          {name:"Winnings", value: winnings>0?`💵 ${winnings}${taxAmount > 0 ? ` (after ${Math.round((taxAmount/(winnings+taxAmount))*100)}% tax)` : ""}`:"💀 Lost", inline:true}
        ]
      }],
      components: [row]
    });
  }
};
