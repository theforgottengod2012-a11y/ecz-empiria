const Government = require("../database/models/Government");
const User = require("../database/models/User");

async function collectTax(guildId, userId, earnedAmount, taxType = "income") {
  const government = await Government.findOne({ guildId });
  if (!government || !government.government.enabled) {
    return { taxAmount: 0, netAmount: earnedAmount };
  }

  let taxRate = government.taxes.incomeTax;
  if (taxType === "gambling") taxRate = government.taxes.gambling;
  if (taxType === "capital") taxRate = government.taxes.capitalGainsTax;
  if (taxType === "business") taxRate = government.taxes.businessTax;

  const taxAmount = Math.floor(earnedAmount * (taxRate / 100));
  const netAmount = earnedAmount - taxAmount;

  if (taxAmount > 0) {
    government.taxes.treasury += taxAmount;
    government.budget.totalRevenue += taxAmount;
    await government.save();
  }

  return { taxAmount, netAmount, taxRate };
}

async function applyGovBenefit(guildId, userId, baseReward) {
  const government = await Government.findOne({ guildId });
  if (!government || !government.government.enabled) {
    return { reward: baseReward, benefit: 0, benefitType: null };
  }

  const citizen = government.citizenship.find(c => c.userId === userId);
  let bonus = 0;
  let benefitType = null;

  if (citizen && government.budget.welfare > 500000) {
    bonus = Math.floor(baseReward * 0.05);
    benefitType = "welfare";
  } else if (government.budget.education > 500000) {
    bonus = Math.floor(baseReward * 0.03);
    benefitType = "education";
  }

  // Healthcare passive benefit: Reduce injury chance if health budget is high
  const hasHealthcare = government.budget.healthcare > 500000;

  return { reward: baseReward + bonus, benefit: bonus, benefitType, hasHealthcare };
}

async function registerCitizen(guildId, userId) {
  const government = await Government.findOne({ guildId });
  if (!government) return null;

  const existing = government.citizenship.find(c => c.userId === userId);
  if (!existing) {
    government.citizenship.push({
      userId,
      joinedAt: new Date(),
      status: "citizen",
      reputation: 0
    });
    await government.save();
  }
  return government;
}

module.exports = {
  collectTax,
  applyGovBenefit,
  registerCitizen
};
