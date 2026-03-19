module.exports = {
  name: "roles",
  description: "View server roles",
  async execute(message, args, client) {
    const roles = message.guild.roles.cache.sort((a, b) => b.position - a.position).map(r => r.name).join(", ");
    message.reply(`🎭 **Roles:** ${roles.substring(0, 1900)}`);
  }
};