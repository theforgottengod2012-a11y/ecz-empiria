module.exports = {
  name: "banner",
  description: "Get user banner",
  async execute(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    const fetchUser = await client.users.fetch(user.id, { force: true });
    if (!fetchUser.banner) return message.reply("❌ This user doesn't have a banner.");
    message.reply(fetchUser.bannerURL({ dynamic: true, size: 1024 }));
  }
};