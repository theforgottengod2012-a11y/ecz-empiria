const { EmbedBuilder } = require("discord.js");
const { startGame } = require("../../utils/gameEngine");
const { hasCooldown } = require("../../utils/cooldown");

module.exports = {
  name: "quiz",
  description: "A quick math quiz!",
  usage: "$quiz",
  async execute(message, args, client) {
    if (hasCooldown(message.author.id, "quiz", 10000)) {
      return message.reply("⏳ Please wait 10s before playing quiz again.");
    }
    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const n1 = Math.floor(Math.random() * 20) + 1;
    const n2 = Math.floor(Math.random() * 20) + 1;
    const answer = eval(`${n1} ${op} ${n2}`);

    const embed = new EmbedBuilder()
      .setTitle("📝 Quick Quiz")
      .setDescription(`What is **${n1} ${op} ${n2}**?`)
      .setFooter({ text: "You have 15 seconds to answer!" })
      .setColor(0xF39C12);

    await message.reply({ embeds: [embed] });

    const filter = m => m.author.id === message.author.id && !isNaN(m.content);
    const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

    collector.on("collect", async m => {
      if (parseInt(m.content) === answer) {
        const reward = await startGame({
          message,
          userId: message.author.id,
          gameName: "quiz",
          rewardRange: { min: 30, max: 80 },
          onWin: () => {}
        });
        message.reply(`✅ Correct! You're a math genius! You won 💰 ${reward}`);
      } else {
        message.reply(`❌ Wrong! The answer was **${answer}**.`);
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time" && collected.size === 0) {
        message.reply(`⏰ Time's up! The answer was **${answer}**.`);
      }
    });
  }
};