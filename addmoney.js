const { User } = require('../../database/models/User');
  module.exports = {
    name: "addmoney",
    description: "Add money (Owner only)",
    async execute(message, args, client) {
      if (message.author.id !== process.env.OWNER_ID) return message.reply("No.");
      
      const target = message.mentions.users.first() || 
                     (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) ||
                     (args[0] ? client.users.cache.find(u => u.username.toLowerCase() === args.join(" ").toLowerCase()) : null);
  
      if (!target) return message.reply("User not found.");
      const amount = parseInt(args[1]);
      let u = await User.findOne({ userId: target.id });
      if (!u) u = new User({ userId: target.id });
      u.wallet += amount;
      await u.save();
      message.reply(`Added ${amount} to ${target.username}`);
    }
  };