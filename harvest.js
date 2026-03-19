const Farm = require("../../database/models/Farm");
const User = require("../../database/models/User");
const { CROPS } = require("../../utils/farmData");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "harvest",
  aliases: ["reap"],
  description: "Harvest all ready crops from your fields.",

  async execute(message, args, client) {
    const userId  = message.author.id;
    const guildId = message.guild.id;

    const farm = await Farm.findOne({ userId, guildId });
    if (!farm || farm.fields.length === 0) {
      return message.reply("❌ You have no farm fields! Buy one with `$buyfield`.");
    }

    const now = Date.now();
    const readyFields = farm.fields.filter(f => f.seedId && f.readyAt && f.readyAt.getTime() <= now);

    if (readyFields.length === 0) {
      const growingFields = farm.fields.filter(f => f.seedId);
      if (growingFields.length === 0) {
        return message.reply("❌ Nothing is planted. Use `$plant <crop>` to plant seeds.");
      }
      const nextReady = Math.min(...growingFields.map(f => f.readyAt?.getTime() || Infinity));
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("🌾 Nothing Ready Yet")
          .setDescription(`Your crops aren't ready! Next harvest: <t:${Math.floor(nextReady / 1000)}:R>`)
          .setColor(0xf1c40f)
          .setFooter({ text: "Use $farm to see all your fields" })]
      });
    }

    // Harvest ready crops into barn
    const harvested = {};
    for (const field of readyFields) {
      const cropId = field.seedId;
      harvested[cropId] = (harvested[cropId] || 0) + 1;

      // Move to barn
      let barnEntry = farm.barn.find(b => b.cropId === cropId);
      if (!barnEntry) {
        farm.barn.push({ cropId, quantity: 1 });
      } else {
        barnEntry.quantity += 1;
      }

      // Clear field
      field.seedId     = null;
      field.plantedAt  = null;
      field.readyAt    = null;
      field.watered    = false;
      field.fertilized = false;
    }

    farm.totalHarvested += readyFields.length;
    farm.markModified("fields");
    farm.markModified("barn");
    await farm.save();

    // Add farming XP to user
    let totalXp = 0;
    const harvestLines = Object.entries(harvested).map(([id, qty]) => {
      const cropData = CROPS[id];
      totalXp += (cropData?.xp || 10) * qty;
      return `${cropData?.emoji || "🌾"} **${cropData?.name || id}** ×${qty} → Stored in barn`;
    });

    const user = await User.findOneAndUpdate(
      { userId },
      { $inc: { xp: totalXp } },
      { new: true }
    );

    const barnTotal = farm.barn.reduce((s, b) => s + b.quantity, 0);

    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("🚜 Harvest Complete!")
        .setColor(0x57f287)
        .setDescription(harvestLines.join("\n"))
        .addFields(
          { name: "📦 Barn Total",    value: `${barnTotal} crops`, inline: true },
          { name: "✨ XP Earned",     value: `+${totalXp} XP`,    inline: true },
          { name: "📊 Total Harvested", value: farm.totalHarvested.toString(), inline: true }
        )
        .setFooter({ text: "Sell crops with $sellcrop • View farm with $farm" })]
    });
  },
};
