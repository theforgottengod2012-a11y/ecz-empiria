const { EmbedBuilder } = require("discord.js");
const { checkCooldown } = require("../../utils/economy");

module.exports = {
  name: "hangman",
  description: "Play a game of Hangman!",
  usage: "$hangman",
  async execute(message, args, client) {
    if (!message || !message.author) return;
    const timeLeft = await checkCooldown(message.author.id, "hangman", 30000);
    if (timeLeft > 0) {
      return message.reply(`⏳ Please wait **${Math.ceil(timeLeft / 1000)}s** before playing hangman again.`);
    }
    const words = ["discord", "mongoose", "economy", "prestige", "javascript", "heist", "bot", "server", "gamer", "mining"];
    const word = words[Math.floor(Math.random() * words.length)].toLowerCase();
    const guessed = [];
    let lives = 6;

    const displayWord = () => word.split("").map(l => (guessed.includes(l) ? l : "_")).join(" ");

    const embed = new EmbedBuilder()
      .setTitle("🪢 Hangman")
      .setDescription(`Word: \`${displayWord()}\`\nLives: ${"❤️".repeat(lives)}\nGuessed: ${guessed.join(", ") || "None"}`)
      .setColor(0x00AE86);

    const gameMessage = await message.reply({ embeds: [embed] });

    const filter = m => m.author.id === message.author.id && m.content.length === 1 && /[a-z]/i.test(m.content);
    const collector = message.channel.createMessageCollector({ filter, time: 60000 });

    collector.on("collect", async m => {
      const char = m.content.toLowerCase();
      if (m.deletable) m.delete().catch(() => {});

      if (guessed.includes(char)) return;
      guessed.push(char);

      if (!word.includes(char)) {
        lives--;
      }

      const isWin = word.split("").every(l => guessed.includes(l));
      const isLoss = lives <= 0;

      if (isWin || isLoss) {
        collector.stop();

        let reward = 0;
        if (isWin) {
          const { addMoney } = require("../../utils/economy");
          reward = Math.floor(Math.random() * (250 - 100 + 1)) + 100;
          await addMoney(message.author.id, reward);
        }

        embed.setTitle(isWin ? "🎉 You Won!" : "💀 Game Over")
          .setDescription(`The word was: **${word}**\n${isWin ? `You guessed it correctly! You won 💰 ${reward}` : "Better luck next time!"}`)
          .setColor(isWin ? 0x57F287 : 0xED4245);
      } else {
        embed.setDescription(`Word: \`${displayWord()}\`\nLives: ${"❤️".repeat(lives)}\nGuessed: ${guessed.join(", ")}`);
      }

      await gameMessage.edit({ embeds: [embed] });
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        embed.setTitle("⏰ Time's Up!")
          .setDescription(`Game ended due to inactivity. The word was: **${word}**`)
          .setColor(0x7289DA);
        gameMessage.edit({ embeds: [embed] });
      }
    });
  }
};