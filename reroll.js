const Giveaway = require("../../database/models/Giveaway");

module.exports = {
  name: "giveaway-reroll",
  async execute(message, args, client) {
    if (!args[0]) return message.reply("Usage: $giveaway reroll <messageId>");
    
    const giveaway = await Giveaway.findOne({ messageId: args[0] });
    if (!giveaway) return message.reply("❌ Not found.");
    if (giveaway.entries.length === 0) return message.reply("❌ No entries to reroll.");

    const winner =
      giveaway.entries[Math.floor(Math.random() * giveaway.entries.length)];

    message.reply(`🔄 New winner: <@${winner}>`);
  }
};
