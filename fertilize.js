const Farm = require("../../database/models/Farm");
const { CROPS, FERTILIZE_REDUCTION } = require("../../utils/farmData");
const { EmbedBuilder } = require("discord.js");

const PREMIUM_REDUCTION = 0.60;

module.exports = {
  name: "fertilize",
  aliases: ["fert"],
  description: "Apply fertilizer to crops, cutting grow time by 35% (or 60% premium). Usage: $fertilize [field#]",

  async execute(message, args, client) {
    const userId  = message.author.id;
    const guildId = message.guild.id;

    const farm = await Farm.findOne({ userId, guildId });
    if (!farm || farm.fields.length === 0) {
      return message.reply("❌ You have no fields! Buy one with `$buyfield`.");
    }

    // Determine which fertilizer type to use
    const hasPremium  = false; // reserved for premium_fertilizer item tracking
    const fertCount   = farm.fertilizer || 0;

    if (fertCount < 1) {
      return message.reply(
        "🌿 You have no fertilizer bags!\n" +
        "Buy one: `$buy fertilizer` ($7,000) or `$buy premium_fertilizer` ($20,000 for 60% reduction)."
      );
    }

    const now = Date.now();
    let fieldNum = parseInt(args[0]) || null;
    let targets;

    if (fieldNum) {
      const field = farm.fields.find(f => f.fieldId === fieldNum);
      if (!field) return message.reply(`❌ Field #${fieldNum} doesn't exist.`);
      if (!field.seedId) return message.reply(`❌ Field #${fieldNum} is empty!`);
      if (field.readyAt && field.readyAt.getTime() <= now) return message.reply(`❌ Field #${fieldNum} is already ready to harvest!`);
      if (field.fertilized) return message.reply(`❌ Field #${fieldNum} is already fertilized.`);
      targets = [field];
    } else {
      targets = farm.fields.filter(f =>
        f.seedId && !f.fertilized && f.readyAt && f.readyAt.getTime() > now
      );
      if (targets.length === 0) {
        return message.reply("🌿 No fields need fertilizing. (All are empty, fertilized, or ready.)");
      }
      targets = targets.slice(0, fertCount);
    }

    const lines = [];
    const reduction = FERTILIZE_REDUCTION; // 35%

    for (const field of targets) {
      if ((farm.fertilizer || 0) < 1) break;
      const crop       = CROPS[field.seedId];
      const oldReadyAt = field.readyAt.getTime();
      const cut        = (oldReadyAt - now) * reduction;
      const newReadyAt = Math.max(now + 1000, oldReadyAt - cut);

      field.readyAt    = new Date(newReadyAt);
      field.fertilized = true;
      farm.fertilizer  -= 1;

      const savedMin = Math.round(cut / 60_000);
      lines.push(
        `🌿 **Field #${field.fieldId}** — ${crop?.emoji || "🌾"} ${crop?.name || field.seedId} | Saved **${savedMin} min** | Ready <t:${Math.floor(newReadyAt / 1000)}:R>`
      );
    }

    farm.markModified("fields");
    await farm.save();

    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("🌿 Fields Fertilized!")
        .setColor(0x2ecc71)
        .setDescription(lines.join("\n"))
        .addFields(
          { name: "🌿 Fertilizer Left", value: `${farm.fertilizer}`, inline: true },
          { name: "💡 Tip", value: "Use `$water` for an extra 10% time reduction!", inline: true }
        )
        .setFooter({ text: "Buy more fertilizer: $buy fertilizer" })]
    });
  },
};
