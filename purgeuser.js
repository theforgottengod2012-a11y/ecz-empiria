const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "purgeuser",
  description: "Delete messages from a specific user in the current channel",
  module: "moderation",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply("❌ You need `Manage Messages` permission.");
    }

    const user = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
    if (!user) return message.reply("❌ Please mention a user or provide their ID.");

    const amount = parseInt(args[1]) || 100;
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const userMessages = messages.filter(m => m.author.id === user.id).first(amount);

    if (userMessages.length === 0) return message.reply("❌ No messages found from that user in the last 100 messages.");

    try {
      await message.channel.bulkDelete(userMessages);
      message.channel.send(`✅ Deleted **${userMessages.length}** messages from **${user.tag}**.`).then(m => setTimeout(() => m.delete(), 5000));
    } catch (err) {
      message.reply("❌ Failed to delete messages (they might be older than 14 days).");
    }
  }
};
