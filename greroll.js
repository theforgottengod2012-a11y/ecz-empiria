const { EmbedBuilder } = require("discord.js");
const Giveaway = require("../../database/models/Giveaway");

module.exports = {
  name: "greroll",
  description: "Reroll a giveaway winner",
  permissions: ["ManageGuild"],
  async execute(message, args) {
    const messageId = args[0];
    if (!messageId) return message.reply("❌ Provide the giveaway message ID.");

    const giveaway = await Giveaway.findOne({ messageId });
    if (!giveaway || !giveaway.ended) return message.reply("❌ Giveaway not found or not ended yet.");

    const msg = await message.channel.messages.fetch(messageId).catch(() => null);
    if (!msg) return message.reply("❌ Could not find the giveaway message.");

    const reaction = msg.reactions.cache.get("🎉");
    const users = await reaction.users.fetch();
    const list = users.filter(u => !u.bot).map(u => u.id);

    if (list.length === 0) return message.reply("❌ No valid participants to reroll.");

    const winnerId = list[Math.floor(Math.random() * list.length)];
    message.channel.send(`🎉 **New Winner:** <@${winnerId}>! Congratulations!`);
  }
};
