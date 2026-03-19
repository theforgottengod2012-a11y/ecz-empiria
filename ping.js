const { EmbedBuilder } = require("discord.js");
const { futuristicEmbed, COLORS } = require("../../utils/embeds");

module.exports = {
  name: "ping",
  description: "Check the bot's neural-link latency",
  async execute(message, args, client) {
    const ping = client.ws.ping;
    const embed = futuristicEmbed("SIGNAL_STRENGTH", `LATENCY: ${ping}ms\nUPLINK: STABLE\nDATABASE: CONNECTED\nSTATUS: OPERATIONAL`, COLORS.CYAN);
    message.reply({ embeds: [embed] });
  },
};