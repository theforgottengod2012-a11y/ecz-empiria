const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios");
const { startGame } = require("../../utils/gameEngine");
const { hasCooldown } = require("../../utils/cooldown");

module.exports = {
  name: "trivia",
  description: "Play a game of Trivia!",
  usage: "$trivia",
  async execute(message, args, client) {
    if (hasCooldown(message.author.id, "trivia", 15000)) {
      return message.reply("⏳ Please wait 15s before playing trivia again.");
    }

    try {
      const response = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
      const data = response.data.results[0];

      const question = decodeURIComponent(data.question);
      const correctAnswer = decodeURIComponent(data.correct_answer);
      const incorrectAnswers = data.incorrect_answers.map(a => decodeURIComponent(a));
      const allAnswers = [...incorrectAnswers, correctAnswer].sort(() => Math.random() - 0.5);

      const embed = new EmbedBuilder()
        .setTitle("❓ Trivia Question")
        .setDescription(`**Category:** ${data.category}\n**Difficulty:** ${data.difficulty}\n\n${question}`)
        .setColor(0x3498DB);

      const row = new ActionRowBuilder();
      allAnswers.forEach((answer, index) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`trivia_${index}`)
            .setLabel(answer.substring(0, 80))
            .setStyle(ButtonStyle.Primary)
        );
      });

      const msg = await message.reply({ embeds: [embed], components: [row] });

      const collector = msg.createMessageComponentCollector({ time: 30000 });

      collector.on("collect", async i => {
        if (i.user.id !== message.author.id) return i.reply({ content: "This is not your trivia!", ephemeral: true });

        const selectedIndex = parseInt(i.customId.split("_")[1]);
        const selectedAnswer = allAnswers[selectedIndex];
        const isCorrect = selectedAnswer === correctAnswer;

        collector.stop();

        let reward = 0;
        if (isCorrect) {
          reward = await startGame({
            message,
            userId: message.author.id,
            gameName: "trivia",
            rewardRange: { min: 50, max: 150 },
            onWin: () => {}
          });
        }

        const resultEmbed = new EmbedBuilder()
          .setTitle(isCorrect ? "✅ Correct!" : "❌ Incorrect")
          .setDescription(`${isCorrect ? `Well done! You won 💰 ${reward}` : `The correct answer was: **${correctAnswer}**`}\n\n${question}`)
          .setColor(isCorrect ? 0x2ECC71 : 0xE74C3C);

        await i.update({ embeds: [resultEmbed], components: [] });
      });
    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to fetch trivia question.");
    }
  }
};