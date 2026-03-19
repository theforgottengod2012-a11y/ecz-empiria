module.exports = {
  name: "boosters",
  description: "View server boosters",
  async execute(message, args, client) {
    const boosters = message.guild.members.cache.filter(m => m.premiumSince).map(m => m.user.username).join(", ");
    message.reply(`💎 **Boosters:** ${boosters || "No boosters yet!"}`);
  }
};