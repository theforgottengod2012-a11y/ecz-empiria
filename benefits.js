const { EmbedBuilder } = require("discord.js");
const Government = require("../../database/models/Government");

module.exports = {
  name: "govbenefits",
  description: "View government benefits you're receiving",
  category: "government",
  ownerOnly: false,
  async execute(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    const government = await Government.findOne({ guildId });
    if (!government || !government.government.enabled) {
      return message.reply("❌ Government system is not enabled.");
    }

    const citizen = government.citizenship.find(c => c.userId === userId);
    if (!citizen) {
      return message.reply("❌ You are not registered as a citizen. Earn money to auto-register!");
    }

    const embed = new EmbedBuilder()
      .setColor("#1f8b4c")
      .setTitle("🏛️ Your Government Benefits")
      .addFields(
        { name: "Status", value: citizen.status, inline: true },
        { name: "Reputation", value: `${citizen.reputation}`, inline: true },
        {
          name: "📋 Active Benefits",
          value: `
${government.budget.welfare > 500000 ? "💳 **Welfare Bonus:** +5% on daily rewards" : "❌ Welfare not funded"}
${government.budget.healthcare > 500000 ? "⚕️ **Healthcare:** Reduced injury on risky events" : "❌ Healthcare not funded"}
${government.budget.education > 500000 ? "🎓 **Education:** +3% on daily rewards" : "❌ Education not funded"}
${government.budget.infrastructure > 500000 ? "🏗️ **Infrastructure:** Faster cooldowns" : "❌ Infrastructure not funded"}
${government.budget.defense > 500000 ? "🛡️ **Defense:** Protection from raids" : "❌ Defense not funded"}
          `,
          inline: false
        },
        {
          name: "💰 Budget Status",
          value: `
Infrastructure: $${government.budget.infrastructure.toLocaleString()}
Healthcare: $${government.budget.healthcare.toLocaleString()}
Education: $${government.budget.education.toLocaleString()}
Defense: $${government.budget.defense.toLocaleString()}
Welfare: $${government.budget.welfare.toLocaleString()}
          `,
          inline: false
        }
      );

    return message.reply({ embeds: [embed] });
  }
};
