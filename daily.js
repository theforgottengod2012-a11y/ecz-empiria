const { addMoney, checkCooldown, getUser, applyPrestigeCoins } = require("../../utils/economy");
const { collectTax, applyGovBenefit, registerCitizen } = require("../../utils/governmentTax");
const globalEvent = require("../../utils/globalEvent");
const { EmbedBuilder } = require("discord.js");
const User = require("../../database/models/User");

const DAILY_REWARD   = 1_000;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1_000;

function streakBonus(streak) {
  if (streak >= 30) return { pct: 200, label: "🔥 30-Day Legend",   color: 0xf1c40f };
  if (streak >= 14) return { pct: 100, label: "⚡ 14-Day Master",   color: 0xe74c3c };
  if (streak >= 7)  return { pct: 50,  label: "🌟 7-Day Champion",  color: 0xe67e22 };
  if (streak >= 3)  return { pct: 25,  label: "✨ 3-Day Streak",    color: 0x3498db };
  if (streak >= 2)  return { pct: 10,  label: "🔥 On a Roll",       color: 0x2ecc71 };
  return { pct: 0, label: null, color: 0x57f287 };
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

module.exports = {
  name: "daily",
  aliases: ["claim"],
  description: "Claim your daily reward. Keep a streak for big bonuses!",
  module: "economy",

  async execute(message, args, client) {
    const userId  = message.author.id;
    const guildId = message.guild.id;

    const timeLeft = await checkCooldown(userId, "daily", DAILY_COOLDOWN);
    if (timeLeft > 0) {
      const h = Math.floor(timeLeft / 3_600_000);
      const m = Math.floor((timeLeft % 3_600_000) / 60_000);
      const userObj  = await getUser(userId);
      const streak   = userObj.dailyStreak || 0;
      const bonus    = streakBonus(streak);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("⏳ Already Claimed!")
          .setDescription(`Your next daily is ready in **${h}h ${m}m**.`)
          .setColor(0xff4444)
          .addFields(
            { name: "🔥 Current Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, inline: true },
            { name: "⚡ Streak Bonus",   value: bonus.pct > 0 ? `+${bonus.pct}% (${bonus.label})` : "None yet — claim tomorrow!", inline: true }
          )
          .setFooter({ text: "Don't break your streak!" })]
      });
    }

    const userObj  = await getUser(userId);
    const today    = todayStr();
    const yesterday = yesterdayStr();

    // Streak logic
    let streak = userObj.dailyStreak || 0;
    if (userObj.lastDailyDate === yesterday) {
      streak += 1;
    } else if (userObj.lastDailyDate === today) {
      // Already claimed today somehow (shouldn't happen due to cooldown, but guard)
      streak = streak;
    } else {
      streak = 1;
    }

    const bonus   = streakBonus(streak);
    let   reward  = DAILY_REWARD;

    if (globalEvent.isActive("double_money")) reward *= 2;
    reward = applyPrestigeCoins(userObj, reward);

    const streakExtra = Math.floor(reward * bonus.pct / 100);
    reward += streakExtra;

    await registerCitizen(guildId, userId);
    const { taxAmount, netAmount, taxRate } = await collectTax(guildId, userId, reward, "income");
    const { benefit, benefitType }          = await applyGovBenefit(guildId, userId, netAmount);
    const finalReward = netAmount + benefit;

    await addMoney(userId, finalReward);
    await User.findOneAndUpdate({ userId }, { dailyStreak: streak, lastDailyDate: today });
    const updated = await getUser(userId);

    const descLines = [
      `**Base Reward:** $${DAILY_REWARD.toLocaleString()}`,
    ];
    if (streakExtra > 0) descLines.push(`**Streak Bonus (${bonus.pct}%):** +$${streakExtra.toLocaleString()} ${bonus.label}`);
    if (globalEvent.isActive("double_money")) descLines.push("**🎉 Double Money Event:** Active!");
    if (taxAmount  > 0) descLines.push(`**Income Tax (${taxRate}%):** -$${taxAmount.toLocaleString()}`);
    if (benefit    > 0) descLines.push(`**${benefitType === "welfare" ? "💳 Welfare" : "🎓 Education"} Bonus:** +$${benefit.toLocaleString()}`);
    descLines.push(`\n**Net Reward:** $${finalReward.toLocaleString()}`);

    const embed = new EmbedBuilder()
      .setTitle("🎁 Daily Reward Claimed!")
      .setDescription(descLines.join("\n"))
      .setColor(bonus.color)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "💰 New Balance",    value: `$${updated.wallet.toLocaleString()}`,         inline: true },
        { name: "🔥 Streak",         value: `${streak} day${streak !== 1 ? "s" : ""}`,     inline: true },
        { name: "🎯 Next Milestone", value: streak < 3 ? "3 days → +25%" : streak < 7 ? "7 days → +50%" : streak < 14 ? "14 days → +100%" : streak < 30 ? "30 days → +200%" : "MAX bonus reached!", inline: true }
      )
      .setFooter({ text: "Come back tomorrow to keep your streak!" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
