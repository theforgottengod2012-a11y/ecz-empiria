module.exports = {
  name: "roast",
  description: "Roast a user",
  usage: "$roast <@user>",
  execute: async (message, args, client) => {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mention someone to roast!");
    
    const roasts = [
      "I'd roast you, but my mom told me not to burn trash.",
      "You're the reason the gene pool needs a lifeguard.",
      "I've seen people like you before, but I had to pay admission.",
      "Your face makes onions cry."
    ];
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    message.reply(`🔥 ${target.username}, ${roast}`);
  }
};