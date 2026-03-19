const { EmbedBuilder } = require("discord.js");
const snipeStore = require("../../utils/snipeStore");

module.exports = {
  name: "snipe",
  aliases: ["s", "S"],
  async execute(message, args) {
    const index = (parseInt(args[0]) || 1) - 1;
    const sniped = snipeStore.get(message.channel.id, index);

    if (!sniped)
      return message.reply("❌ No deleted messages found.");

    const embed = new EmbedBuilder()
      .setTitle("🕵️ Sniped Message")
      .addFields(
        { name: "Author", value: sniped.author },
        { name: "Message", value: sniped.content }
      )
      .setFooter({ text: `Deleted ${index + 1} messages ago` })
      .setColor("Purple");

    message.channel.send({ embeds: [embed] });
  }
};
