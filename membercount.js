module.exports = {
  name: "membercount",
  description: "View server member count",
  async execute(message, args, client) {
    message.reply(`👥 **Members:** ${message.guild.memberCount}`);
  }
};