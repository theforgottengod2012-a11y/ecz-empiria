module.exports = {
  name: "channels",
  description: "View server channels",
  async execute(message, args, client) {
    const channels = message.guild.channels.cache.map(c => c.name).join(", ");
    message.reply(`📁 **Channels:** ${channels.substring(0, 1900)}`);
  }
};