const { EmbedBuilder } = require("discord.js");
const { startGame } = require("../../utils/gameEngine");
const { hasCooldown } = require("../../utils/cooldown");

module.exports = {
  name: "wordle",
  description: "Play a game of Wordle!",
  usage: "$wordle",
  async execute(message, args, client) {
    if (hasCooldown(message.author.id, "wordle", 60000)) {
      return message.reply("⏳ Please wait 1m before playing wordle again.");
    }
    const words = ["react", "build", "world", "stone", "water", "flame", "light", "night", "green", "smart"];
    const target = words[Math.floor(Math.random() * words.length)].toLowerCase();
    let attempts = 0;
    const maxAttempts = 6;
    const guesses = [];

    const getBoard = () => {
      let board = "";
      for (let i = 0; i < maxAttempts; i++) {
        const guess = guesses[i];
        if (guess) {
          let line = "";
          for (let j = 0; j < 5; j++) {
            if (guess[j] === target[j]) line += "🟩";
            else if (target.includes(guess[j])) line += "🟨";
            else line += "⬛";
          }
          board += line + `  \`${guess.toUpperCase()}\`\n`;
        } else {
          board += "⬜⬜⬜⬜⬜\n";
        }
      }
      return board;
    };

    const embed = new EmbedBuilder()
      .setTitle("🟩 Wordle")
      .setDescription(getBoard())
      .setFooter({ text: `Guess a 5-letter word! (${attempts}/${maxAttempts})` })
      .setColor(0x57F287);

    const gameMessage = await message.reply({ embeds: [embed] });

    const filter = m => m.author.id === message.author.id && m.content.length === 5 && /^[a-z]+$/i.test(m.content);
    const collector = message.channel.createMessageCollector({ filter, time: 120000 });

    collector.on("collect", async m => {
      const guess = m.content.toLowerCase();
      if (m.deletable) m.delete().catch(() => {});

      guesses.push(guess);
      attempts++;

      if (guess === target || attempts >= maxAttempts) {
        collector.stop();
        const win = guess === target;

        let reward = 0;
        if (win) {
          reward = await startGame({
            message,
            userId: message.author.id,
            gameName: "wordle",
            rewardRange: { min: 200, max: 500 },
            onWin: () => {}
          });
        }

        embed.setTitle(win ? "🎉 Wordle Victory!" : "💀 Wordle Failed")
          .setDescription(getBoard() + `\nThe word was: **${target.toUpperCase()}**${win ? `\n\nYou won 💰 ${reward}!` : ""}`)
          .setColor(win ? 0x57F287 : 0xED4245);
      } else {
        embed.setDescription(getBoard())
          .setFooter({ text: `Guess a 5-letter word! (${attempts}/${maxAttempts})` });
      }

      await gameMessage.edit({ embeds: [embed] });
    });
  }
};