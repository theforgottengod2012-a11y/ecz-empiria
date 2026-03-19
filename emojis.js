module.exports = {
  name: "emojis",
  description: "View server emojis",
  async execute(message, args, client) {
    const emojis = message.guild.emojis.cache.map(e => e.toString()).join(" ");
    message.reply(`😀 **Emojis:** ${emojis.substring(0, 1900) || "None"}`);
  }
};