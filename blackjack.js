const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUser, addMoney, removeMoney, checkCooldown } = require("../../utils/economy");

const BJ_CD = 10_000;

const SUITS = ["♠️","♥️","♦️","♣️"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function buildDeck() {
  const deck = [];
  for (const s of SUITS) for (const v of VALUES) deck.push({ suit: s, value: v });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardVal(card) {
  if (["J","Q","K"].includes(card.value)) return 10;
  if (card.value === "A") return 11;
  return parseInt(card.value);
}

function handTotal(hand) {
  let total = 0, aces = 0;
  for (const c of hand) {
    const v = cardVal(c);
    total += v;
    if (c.value === "A") aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function handStr(hand, hideSecond = false) {
  if (hideSecond && hand.length >= 2) {
    return `${hand[0].value}${hand[0].suit} | ❓`;
  }
  return hand.map(c => `${c.value}${c.suit}`).join("  ");
}

function buildEmbed(playerHand, dealerHand, bet, status, hideDealer = false) {
  const playerTotal = handTotal(playerHand);
  const dealerTotal = hideDealer ? "?" : handTotal(dealerHand);

  const color = status === "win" ? 0x57f287 : status === "lose" ? 0xed4245 : status === "push" ? 0xfee75c : 0x5865f2;

  const titles = {
    playing: "🃏 Blackjack — Your Turn",
    win:     "🎉 Blackjack — You Win!",
    lose:    "💀 Blackjack — You Lose!",
    bust:    "💥 Blackjack — Bust!",
    push:    "🤝 Blackjack — Push!",
    bj:      "⭐ Blackjack! Natural 21!"
  };

  return new EmbedBuilder()
    .setTitle(titles[status] || "🃏 Blackjack")
    .setColor(color)
    .addFields(
      { name: `🤵 Dealer  (${dealerTotal})`, value: handStr(dealerHand, hideDealer), inline: false },
      { name: `👤 You  (${playerTotal})`,    value: handStr(playerHand),              inline: false },
      { name: "💵 Bet",                      value: `$${bet.toLocaleString()}`,        inline: true  },
    )
    .setFooter({ text: status === "playing" ? "Hit to draw • Stand to hold • Double to double down" : "Thanks for playing!" });
}

module.exports = {
  name: "blackjack",
  aliases: ["bj"],
  description: "Play interactive blackjack with Hit / Stand / Double Down!",
  module: "economy",

  async execute(message, args, client) {
    const userId = message.author.id;
    const bet    = parseInt(args[0]);
    const MAX    = 250_000;

    if (!bet || bet <= 0 || bet > MAX) {
      return message.reply(`❌ Usage: \`$blackjack <amount>\` — Max bet: $${MAX.toLocaleString()}`);
    }

    const user = await getUser(userId);
    if (user.wallet < bet) return message.reply("❌ You don't have enough money.");

    const cd = await checkCooldown(userId, "blackjack", BJ_CD);
    if (cd > 0) return message.reply("⏳ Wait a few seconds before playing again.");

    await removeMoney(userId, bet);

    const deck   = buildDeck();
    let pHand    = [deck.pop(), deck.pop()];
    let dHand    = [deck.pop(), deck.pop()];
    let gameOver = false;
    let msg      = null;

    const pTotal = handTotal(pHand);
    const dTotal = handTotal(dHand);

    // Natural blackjack check
    if (pTotal === 21) {
      const bj_win = Math.floor(bet * 2.5);
      await addMoney(userId, bj_win);
      return message.reply({
        embeds: [buildEmbed(pHand, dHand, bet, "bj").addFields(
          { name: "💰 Payout", value: `$${bj_win.toLocaleString()} (1.5x)`, inline: true }
        )]
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("bj_hit").setLabel("Hit 🃏").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("bj_stand").setLabel("Stand ✋").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("bj_double").setLabel("Double Down 💰").setStyle(ButtonStyle.Danger)
    );

    msg = await message.reply({
      embeds: [buildEmbed(pHand, dHand, bet, "playing", true)],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 60_000,
    });

    const endGame = async (status, extra = {}) => {
      gameOver = true;
      let finalEmbed = buildEmbed(pHand, dHand, bet, status);
      let payout = 0;

      if (status === "win") {
        payout = bet * 2;
        await addMoney(userId, payout);
        finalEmbed.addFields({ name: "💰 Payout", value: `$${payout.toLocaleString()}`, inline: true });
      } else if (status === "push") {
        await addMoney(userId, bet);
        finalEmbed.addFields({ name: "💰 Refund", value: `$${bet.toLocaleString()}`, inline: true });
      } else if (status === "bj") {
        payout = Math.floor(bet * 2.5);
        await addMoney(userId, payout);
        finalEmbed.addFields({ name: "💰 Payout (1.5x)", value: `$${payout.toLocaleString()}`, inline: true });
      }
      if (extra.doubleDown) {
        finalEmbed.addFields({ name: "🎯 Double Down", value: "Applied!", inline: true });
      }

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bj_hit").setLabel("Hit 🃏").setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId("bj_stand").setLabel("Stand ✋").setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId("bj_double").setLabel("Double Down 💰").setStyle(ButtonStyle.Danger).setDisabled(true)
      );

      await msg.edit({ embeds: [finalEmbed], components: [disabledRow] }).catch(() => {});
      collector.stop();
    };

    const dealerPlay = async () => {
      while (handTotal(dHand) < 17) dHand.push(deck.pop());
      const p = handTotal(pHand);
      const d = handTotal(dHand);
      if (d > 21) return endGame("win");
      if (p > d)  return endGame("win");
      if (d > p)  return endGame("lose");
      return endGame("push");
    };

    collector.on("collect", async i => {
      if (gameOver) return i.deferUpdate().catch(() => {});
      await i.deferUpdate().catch(() => {});

      if (i.customId === "bj_hit") {
        pHand.push(deck.pop());
        const total = handTotal(pHand);
        if (total > 21) return endGame("bust");
        if (total === 21) return dealerPlay();
        await msg.edit({ embeds: [buildEmbed(pHand, dHand, bet, "playing", true)], components: [row] }).catch(() => {});
      }

      if (i.customId === "bj_stand") {
        return dealerPlay();
      }

      if (i.customId === "bj_double") {
        const u = await getUser(userId);
        if (u.wallet < bet) {
          await i.followUp({ content: "❌ Not enough money to double down!", ephemeral: true }).catch(() => {});
          return dealerPlay();
        }
        await removeMoney(userId, bet);
        pHand.push(deck.pop());
        const total = handTotal(pHand);
        bet *= 2;
        if (total > 21) return endGame("bust", { doubleDown: true });
        return dealerPlay();
      }
    });

    collector.on("end", (_, reason) => {
      if (reason === "time" && !gameOver) {
        endGame("lose");
      }
    });
  }
};
