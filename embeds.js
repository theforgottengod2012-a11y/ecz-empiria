const { EmbedBuilder } = require("discord.js");

const COLORS = {
  CYAN: 0x00ffff,
  MAGENTA: 0xff00ff,
  BLUE: 0x0088ff,
  ERROR: 0xff4444,
  SUCCESS: 0x00ff88,
  YELLOW: 0xF1C40F,
};

const futuristicEmbed = (title, description, color = COLORS.CYAN) => {
  return new EmbedBuilder()
    .setTitle(`[ ${title.toUpperCase()} ]`)
    .setDescription(`\`\`\`${description}\`\`\``)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: "NEURAL_LINK_ACTIVE // SYSTEM_STABLE" });
};

const dataEmbed = (title, fields, color = COLORS.BLUE) => {
  return new EmbedBuilder()
    .setTitle(`> ${title.toUpperCase()}`)
    .addFields(fields.map(f => ({ ...f, name: `▫️ ${f.name.toUpperCase()}` })))
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: "ENCRYPTED_DATA_STREAM" });
};

module.exports = {
  COLORS,
  futuristicEmbed,
  dataEmbed,
};