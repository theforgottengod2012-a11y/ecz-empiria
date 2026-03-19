module.exports = {
  name: "server_id",
  description: "Get server ID",
  async execute(message, args, client) {
    message.reply(`🆔 **Server ID:** ${message.guild.id}`);
  }
};