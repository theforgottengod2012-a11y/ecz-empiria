const User = require("../../database/models/User");
const Government = require("../../database/models/Government");
const { logAction } = require("../../utils/modLogging");

module.exports = {
  name: "heal",
  description: "Visit the hospital to treat injuries",
  async execute(message, args) {
    const user = await User.findOne({ userId: message.author.id });
    if (!user || user.injuries.length === 0) return message.reply("✅ You are perfectly healthy!");

    const gov = await Government.findOne({ guildId: message.guild.id });
    const cost = 500;
    
    // Healthcare benefit
    const isHealthcareGood = gov && gov.budget.healthcare > 500000;
    const finalCost = isHealthcareGood ? Math.floor(cost * 0.5) : cost;

    if (user.wallet < finalCost) return message.reply(`❌ You need **$${finalCost}** to afford treatment.`);

    user.wallet -= finalCost;
    user.health = 100;
    user.injuries = [];
    await user.save();

    await logAction(message.guild.id, message.author.id, "HEAL", `Treated injuries for $${finalCost}`, message.author.id, { discount: isHealthcareGood });

    return message.reply(`🏥 You have been treated! Your health is back to 100%. ${isHealthcareGood ? "(50% Government Healthcare Discount applied!)" : ""}`);
  }
};
