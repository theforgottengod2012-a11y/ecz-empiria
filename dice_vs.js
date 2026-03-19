const { getUser, addMoney, removeMoney, checkCooldown } = require("../../utils/economy");
const { collectTax } = require("../../utils/governmentTax");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const DICE_COOLDOWN = 10 * 1000;
const MAX_BET = 250000;

module.exports = {
  name: "dice_vs",
  aliases: ["dvs"],
  description: "Challenge a user to a dice game",
  module: "economy",

  async execute(message, args, client) {
    const opponent = message.mentions.users.first();
    const bet = parseInt(args[1]);

    if (!opponent || opponent.id === message.author.id) return message.reply("❌ Mention a valid opponent.");
    if (!bet || bet <= 0 || bet > MAX_BET) return message.reply(`❌ Invalid bet (Max: 💵 ${MAX_BET})`);

    const user = await getUser(message.author.id);
    const oppUser = await getUser(opponent.id);

    if (user.wallet < bet) return message.reply("❌ You don't have enough money.");
    if (oppUser.wallet < bet) return message.reply(`❌ <@${opponent.id}> doesn't have enough money.`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`dvs_accept_${message.author.id}`).setLabel("Accept").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`dvs_decline_${message.author.id}`).setLabel("Decline").setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setTitle("🎲 Dice Challenge")
      .setDescription(`<@${opponent.id}>, you've been challenged to a dice duel!\n**Bet:** 💵 ${bet}\n\nYou will each roll 2 dice. Highest total wins!`)
      .setColor("#5865F2");

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 30000 });
    collector.on('collect', async i => {
      if (i.customId === `dvs_accept_${message.author.id}`) {
        if (i.user.id !== opponent.id) return i.reply({ content: "❌ Only the challenged can respond.", ephemeral: true });

        // Both roll 2 dice
        const playerRoll = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        const opponentRoll = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];

        const playerTotal = playerRoll[0] + playerRoll[1];
        const opponentTotal = opponentRoll[0] + opponentRoll[1];

        let winner, loser, winAmount;

        if (playerTotal > opponentTotal) {
          winner = message.author.id;
          loser = opponent.id;
          await removeMoney(opponent.id, bet);
          const { netAmount } = await collectTax(message.guild.id, message.author.id, bet * 2, "gambling");
          await addMoney(message.author.id, netAmount);
          winAmount = netAmount;
        } else if (opponentTotal > playerTotal) {
          winner = opponent.id;
          loser = message.author.id;
          await removeMoney(message.author.id, bet);
          const { netAmount } = await collectTax(message.guild.id, opponent.id, bet * 2, "gambling");
          await addMoney(opponent.id, netAmount);
          winAmount = netAmount;
        } else {
          // Draw - return bets
          await i.update({
            embeds: [new EmbedBuilder()
              .setTitle("🎲 Dice Duel - DRAW!")
              .setDescription(`Both rolled the same total!\n\n**You:** ${playerRoll[0]} + ${playerRoll[1]} = ${playerTotal}\n**Opponent:** ${opponentRoll[0]} + ${opponentRoll[1]} = ${opponentTotal}\n\n💰 Bets returned to both players`)
              .setColor("#FFD700")],
            components: []
          });
          return;
        }

        await i.update({
          embeds: [new EmbedBuilder()
            .setTitle("🎲 Dice Duel - RESULT")
            .setDescription(`**${message.author.username}:** ${playerRoll[0]} + ${playerRoll[1]} = ${playerTotal}\n**${opponent.username}:** ${opponentRoll[0]} + ${opponentRoll[1]} = ${opponentTotal}\n\n<@${winner}> wins 💰 ${winAmount}!`)
            .setColor(winner === message.author.id ? "#57f287" : "#ed4245")],
          components: []
        });
      } else if (i.customId === `dvs_decline_${message.author.id}`) {
        if (i.user.id !== opponent.id) return i.reply({ content: "❌ Only the challenged can respond.", ephemeral: true });
        await i.update({ content: "❌ Challenge declined.", components: [] });
      }
    });
  }
};
