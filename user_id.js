module.exports = {
  name: "user_id",
  description: "Get user ID",
  async execute(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    message.reply(`🆔 **User ID:** ${user.id}`);
  }
};