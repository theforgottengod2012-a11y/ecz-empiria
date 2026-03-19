const { getUser, addMoney, removeMoney, checkCooldown } = require("../../utils/economy");
const { collectTax, registerCitizen } = require("../../utils/governmentTax");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "coinflip_vs",
  aliases: ["cfvs"],
  description: "Challenge a user to coinflip",
  module: "economy",

  async execute(message, args, client) {
    const opponent = message.mentions.users.first();
    const bet = parseInt(args[1]);

    if (!opponent || opponent.id === message.author.id) return message.reply("❌ Mention a valid opponent.");
    if (!bet || bet <= 0 || bet > 250000) return message.reply("❌ Invalid bet amount (Max: 250,000).");

    const user = await getUser(message.author.id);
    const oppUser = await getUser(opponent.id);

    if (user.wallet < bet) return message.reply("❌ You don't have enough money.");
    if (oppUser.wallet < bet) return message.reply(`❌ <@${opponent.id}> doesn't have enough money.`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`cfvs_accept_${message.author.id}`).setLabel("Accept").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`cfvs_decline_${message.author.id}`).setLabel("Decline").setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setTitle("🪙 Coinflip Challenge")
      .setDescription(`<@${opponent.id}>, you've been challenged to a coinflip!\n**Bet:** 💵 ${bet}`)
      .setColor("#5865F2");

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 30000 });
    collector.on('collect', async i => {
      if (i.customId === `cfvs_accept_${message.author.id}`) {
        if (i.user.id !== opponent.id) return i.reply({ content: "❌ Only the challenged can respond.", ephemeral: true });

        const flip = Math.random() < 0.5;
        let winnerText, loserText;

        if (flip) {
          await removeMoney(opponent.id, bet);
          const { netAmount } = await collectTax(message.guild.id, message.author.id, bet * 2, "gambling");
          await addMoney(message.author.id, netAmount);
          winnerText = `<@${message.author.id}> wins 💰`;
          loserText = `<@${opponent.id}> loses`;
        } else {
          await removeMoney(message.author.id, bet);
          const { netAmount } = await collectTax(message.guild.id, opponent.id, bet * 2, "gambling");
          await addMoney(opponent.id, netAmount);
          winnerText = `<@${opponent.id}> wins 💰`;
          loserText = `<@${message.author.id}> loses`;
        }

        await i.update({
          embeds: [new EmbedBuilder().setTitle("🪙 Result").setDescription(`${flip ? "Heads" : "Tails"}!\n\n${winnerText}\n${loserText}`).setColor(flip ? "#57f287" : "#ed4245")],
          components: []
        });
      } else if (i.customId === `cfvs_decline_${message.author.id}`) {
        if (i.user.id !== opponent.id) return i.reply({ content: "❌ Only the challenged can respond.", ephemeral: true });
        await i.update({ content: "❌ Challenge declined.", components: [] });
      }
    });
  }
};
