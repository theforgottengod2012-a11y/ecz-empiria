module.exports = {
  name: "ship",
  description: "Ship two users together",
  usage: "$ship <@user1> [@user2]",
  execute: async (message, args, client) => {
    const user1 = message.mentions.users.first() || message.author;
    const user2 = message.mentions.users.at(1) || (message.mentions.users.first() && message.mentions.users.first().id !== message.author.id ? message.author : null);
    
    if (!user2) return message.reply("❌ Please mention at least one other person!");
    
    const percent = Math.floor(Math.random() * 101);
    message.reply(`❤️ **${user1.username}** & **${user2.username}** are a **${percent}%** match!`);
  }
};