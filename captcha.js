const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const GuildSettings = require("../../database/models/GuildSettings");

const PUZZLES = [
  { q: "What is 5 + 3?", a: ["8"] },
  { q: "What is 10 - 4?", a: ["6"] },
  { q: "What color is the sky?", a: ["blue"] },
  { q: "How many sides does a triangle have?", a: ["3", "three"] },
  { q: "What is 2 × 6?", a: ["12", "twelve"] },
  { q: "What is 15 ÷ 3?", a: ["5", "five"] },
  { q: "Type the word: DISCORD", a: ["discord"] },
  { q: "What is 7 + 7?", a: ["14", "fourteen"] },
];

module.exports = {
  name: "verify",
  description: "Verify yourself with a simple puzzle to get the member role",
  module: "verify",

  async execute(message, args, client) {
    const puzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];

    const embed = new EmbedBuilder()
      .setTitle("🔐 Verification Required")
      .setDescription(
        `Please answer the following question to verify yourself:\n\n**${puzzle.q}**\n\nType your answer in this channel. You have **60 seconds**.`
      )
      .setColor(0x5865f2)
      .setFooter({ text: "Empiria Verification System" });

    const msg = await message.reply({ embeds: [embed] });

    const filter = m => m.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({ filter, time: 60_000, max: 3 });

    collector.on("collect", async response => {
      const answer = response.content.toLowerCase().trim();
      if (puzzle.a.includes(answer)) {
        collector.stop("correct");

        try {
          const settings = await GuildSettings.findOne({ guildId: message.guild.id });
          if (settings?.autorole) {
            const role = message.guild.roles.cache.get(settings.autorole);
            if (role) {
              await message.member.roles.add(role).catch(() => {});
            }
          }
        } catch (err) {}

        return message.channel.send({
          embeds: [new EmbedBuilder()
            .setTitle("✅ Verified!")
            .setDescription(`Welcome, ${message.author}! You've been verified.`)
            .setColor(0x57f287)]
        });
      } else {
        response.reply("❌ Incorrect answer, try again.").then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
      }
    });

    collector.on("end", (_, reason) => {
      if (reason !== "correct") {
        message.channel.send({
          embeds: [new EmbedBuilder()
            .setTitle("❌ Verification Failed")
            .setDescription("You ran out of attempts. Use `$verify` again to try.")
            .setColor(0xed4245)]
        }).catch(() => {});
      }
    });
  },
};
