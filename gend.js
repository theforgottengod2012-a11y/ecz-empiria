const { EmbedBuilder } = require("discord.js");
const Giveaway = require("../../database/models/Giveaway");
const User = require("../../database/models/User");

module.exports = {
  name: "gend",
  description: "End a giveaway early",
  permissions: ["ManageGuild"],
  async execute(message, args) {
    const messageId = args[0];
    if (!messageId) return message.reply("❌ Provide the giveaway message ID.");

    const giveaway = await Giveaway.findOne({ messageId });
    if (!giveaway || giveaway.ended) return message.reply("❌ Giveaway not found or already ended.");

    giveaway.endTime = Date.now();
    await giveaway.save();
    message.reply("✅ Giveaway will end shortly.");
  }
};
