const { EmbedBuilder } = require("discord.js");
const Giveaway = require("../../database/models/Giveaway");
const ms = require("ms");

module.exports = {
  name: "giveaway-start",
  async execute(message, args, client) {
    if (!args[0] || !args[1] || !args[2]) return message.reply("Usage: $giveaway start <time> <winners> <prize>");
    
    const time = ms(args[0]);
    if (!time) return message.reply("Invalid time format.");
    
    const winners = parseInt(args[1]);
    const prize = args.slice(2).join(" ");

    const channel = await message.guild.channels.create({
      name: "🎉┃giveaway",
      type: 0
    });

    const embed = new EmbedBuilder()
      .setTitle("🎉 GIVEAWAY!")
      .setDescription(
        `Prize: **${prize}**\nWinners: **${winners}**\nReact 🎉 to enter`
      )
      .setColor(0xffc107)
      .setFooter({ text: "Ends soon..." });

    const msg = await channel.send({ embeds: [embed] });
    await msg.react("🎉");

    await Giveaway.create({
      guildId: message.guild.id,
      channelId: channel.id,
      messageId: msg.id,
      prize,
      winners,
      endsAt: Date.now() + time,
      entries: []
    });
  }
};
